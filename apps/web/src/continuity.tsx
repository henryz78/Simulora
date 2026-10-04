import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import { t } from "./i18n.js";
import { Link, NavLink, Outlet, useParams } from "react-router";
import {
  actionResponseSchema,
  authoritativeStateResponseSchema,
  branchActionHistorySchema,
  type CorrectionRequest,
  type ActionResponse,
  type AuthoritativeStateResponse,
  type BranchActionHistory,
} from "@simulora/contracts";
import { submitCorrection as sendCorrection } from "./ip4-api.js";
import { confirmRestore, prepareRestore } from "./ip5-api.js";

export type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: AuthoritativeStateResponse }
  | { status: "not-found" }
  | { status: "error" };

export type BranchAction = BranchActionHistory["actions"][number];

export type HistoryState = "loading" | "ready" | "unavailable";

export type BranchHistoryReadResult = {
  actions: BranchAction[];
  available: boolean;
};

export type ActionResult = {
  action: ActionResponse | null;
  error: string | null;
};

type RequestedEffect =
  | "FACT_REWRITE"
  | "ROUTINE_EFFECT"
  | "NO_WORLD_EFFECT"
  | "RELATIONSHIP_EFFECT"
  | "THREAD_EFFECT"
  | "STORY_DECIDES";

/** A scaled relationship the selected Character is part of, read from current state. */
function scaledRelationshipsOf(state: AuthoritativeStateResponse["state"], characterId: string) {
  return state.relationships.filter((item) => {
    const record =
      typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null;
    return (
      typeof record?.state === "string" &&
      (record.fromCharacterId === characterId || record.toCharacterId === characterId)
    );
  });
}

export type CorrectionResult = {
  action: ActionResponse | null;
  status: number;
  error: string | null;
  errorCode: string | null;
};

export type ContinuityContextValue = {
  continuityId: string;
  loadState: LoadState;
  historyState: HistoryState;
  history: BranchAction[];
  actions: ReadonlyMap<string, ActionResponse>;
  pendingActions: ActionResponse[];
  pendingActionRefs: BranchAction[];
  selectedActionId: string | null;
  setSelectedActionId: (actionId: string | null) => void;
  refresh: () => Promise<void>;
  readAction: (actionId: string) => Promise<ActionResponse | null>;
  submitAction: (
    intent: string,
    targetCharacterId?: string,
    requestedEffect?: RequestedEffect,
    targetThreadId?: string,
  ) => Promise<ActionResult>;
  submitCorrection: (request: CorrectionRequest) => Promise<CorrectionResult>;
  confirmAction: (action: ActionResponse) => Promise<ActionResult>;
  cancelAction: (action: ActionResponse) => Promise<ActionResult>;
  retryAction: (action: ActionResponse) => Promise<ActionResult>;
  /** PX-2a: L2 proposals are confirmed by this client as they arrive. */
  quickPlay: boolean;
  setQuickPlay: (enabled: boolean) => void;
  autoConfirmedIds: ReadonlySet<string>;
  /** Actions undone in this session; their words stay in the story. */
  undoneIds: ReadonlySet<string>;
  /** Restore the head before this committed Action, as an appended Commit. */
  undoAction: (action: ActionResponse) => Promise<string | null>;
};

const TERMINAL_ACTION_STATUSES = new Set<ActionResponse["status"]>([
  "COMMITTED",
  "COMPLETED_NO_EFFECT",
  "CANCELLED",
  "SUPERSEDED",
]);

const ContinuityContext = createContext<ContinuityContextValue | null>(null);

export async function readWorldState(continuityId: string | undefined): Promise<LoadState> {
  if (!continuityId) return { status: "not-found" };
  try {
    const response = await fetch(`/v1/continuities/${encodeURIComponent(continuityId)}/state`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) throw new Error("state request failed");
    return {
      status: "ready",
      data: authoritativeStateResponseSchema.parse(await response.json()),
    };
  } catch {
    return { status: "error" };
  }
}

export async function readBranchHistoryResult(branchId: string): Promise<BranchHistoryReadResult> {
  try {
    const response = await fetch(`/v1/branches/${encodeURIComponent(branchId)}/actions`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return { actions: [], available: false };
    return {
      actions: branchActionHistorySchema.parse(await response.json()).actions,
      available: true,
    };
  } catch {
    return { actions: [], available: false };
  }
}

export async function readBranchHistory(branchId: string): Promise<BranchAction[]> {
  return (await readBranchHistoryResult(branchId)).actions;
}

export async function readJson(url: string, init?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// SA-2 M1: the RE-2 refusal for an addressed Character, not any 422.
// The server's wire text: compared, never translated.
const characterKnowledgeRefusal =
  "The selected Character is unavailable or cannot know this Action target";

function pendingHistory(history: BranchAction[]): BranchAction[] {
  return history.filter((entry) => !TERMINAL_ACTION_STATUSES.has(entry.status));
}

const ACTION_PROGRESS_RANK: Record<ActionResponse["status"], number> = {
  ACKNOWLEDGED: 1,
  GENERATING: 2,
  VALIDATING: 3,
  AWAITING_CONFIRMATION: 4,
  COMMITTING: 5,
  COMMITTED: 6,
  COMPLETED_NO_EFFECT: 6,
  FAILED_RECOVERABLE: 5,
  CONFLICT: 6,
  CANCELLED: 6,
  SUPERSEDED: 6,
};

function shouldAcceptAction(
  previous: ActionResponse["status"] | undefined,
  incoming: ActionResponse["status"],
): boolean {
  if (!previous || previous === incoming) return true;
  if (previous === "CONFLICT") return incoming === "SUPERSEDED";
  // A retry is the one legal backwards-looking transition: a recoverable
  // failure can be reopened for generation. All other terminal states are
  // immutable and an older read must never regress them.
  if (previous === "FAILED_RECOVERABLE" && incoming === "GENERATING") return true;
  if (TERMINAL_ACTION_STATUSES.has(previous)) return false;
  if (TERMINAL_ACTION_STATUSES.has(incoming) || incoming === "FAILED_RECOVERABLE") return true;
  return ACTION_PROGRESS_RANK[incoming] > ACTION_PROGRESS_RANK[previous];
}

function mergeAction(
  current: Map<string, ActionResponse>,
  action: ActionResponse,
): Map<string, ActionResponse> {
  const previous = current.get(action.id);
  if (previous && !shouldAcceptAction(previous.status, action.status)) return current;
  const next = new Map(current);
  next.set(action.id, action);
  return next;
}

function updateHistoryForAction(history: BranchAction[], action: ActionResponse): BranchAction[] {
  const existing = history.some((entry) => entry.id === action.id);
  const next = history.map((entry) =>
    entry.id === action.id
      ? {
          ...entry,
          status: shouldAcceptAction(entry.status, action.status) ? action.status : entry.status,
          committedAt:
            shouldAcceptAction(entry.status, action.status) && action.commit?.committedAt
              ? action.commit.committedAt
              : entry.committedAt,
          // The action's own record wins over a cached history entry (PX-1 review M1).
          narrative:
            action.proposal?.narrative ?? action.dialogue?.narrative ?? entry.narrative ?? null,
        }
      : entry,
  );
  if (existing) return next;
  return [
    ...next,
    {
      id: action.id,
      status: action.status,
      intent: action.intent,
      acknowledgedAt: action.acknowledgedAt,
      committedAt: action.commit?.committedAt ?? null,
      narrative: action.proposal?.narrative ?? action.dialogue?.narrative ?? null,
    },
  ];
}

function mergeBranchHistory(current: BranchAction[], incoming: BranchAction[]): BranchAction[] {
  const currentById = new Map(current.map((entry) => [entry.id, entry]));
  const merged = incoming.map((entry) => {
    const previous = currentById.get(entry.id);
    currentById.delete(entry.id);
    if (!previous) return entry;
    const narrative = entry.narrative ?? previous.narrative;
    if (shouldAcceptAction(previous.status, entry.status)) return { ...entry, narrative };
    return {
      ...entry,
      status: previous.status,
      committedAt: previous.committedAt ?? entry.committedAt,
      narrative,
    };
  });
  return [...merged, ...currentById.values()];
}

/** PX-4a: one Strict mode preference for this browser, for every Continuity. */
export const strictModeKey = "simulora.strictMode";

function ambiguousActionOutcome(
  operation: "confirmation" | "cancellation" | "retry",
  current: ActionResponse | null,
): string {
  if (current?.status === "COMMITTED" || current?.status === "COMPLETED_NO_EFFECT") {
    return t(
      "The {operation} response was lost, but this Action is durably complete. Read current state before taking another Action.",
      { operation: t(operation) },
    );
  }
  if (current && ["CONFLICT", "CANCELLED", "SUPERSEDED"].includes(current.status)) {
    return t(
      "The {operation} response was lost; the durable Action status is {status}. Re-read current state before continuing.",
      { operation: t(operation), status: labelMode(current.status) },
    );
  }
  return t(
    "The {operation} outcome is unknown. Recover this Action's status before retrying; current truth may have changed.",
    { operation: t(operation) },
  );
}

export function ContinuityProvider({
  continuityId,
  children,
}: PropsWithChildren<{ continuityId: string }>): ReactElement {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [historyState, setHistoryState] = useState<HistoryState>("loading");
  const [history, setHistory] = useState<BranchAction[]>([]);
  const [actions, setActions] = useState<Map<string, ActionResponse>>(new Map());
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const pendingSubmission = useRef<
    Map<string, { idempotencyKey: string; intent: string; expectedHeadCommitId: string }>
  >(new Map());
  const loadGeneration = useRef(0);
  const actionsRef = useRef(actions);
  const loadStateRef = useRef(loadState);
  const historyRef = useRef<{ branchId: string | null; actions: BranchAction[] }>({
    branchId: null,
    actions: [],
  });

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);
  useEffect(() => {
    loadStateRef.current = loadState;
  }, [loadState]);

  const upsertAction = useCallback((action: ActionResponse): void => {
    setActions((current) => {
      const next = mergeAction(current, action);
      actionsRef.current = next;
      return next;
    });
    const currentHistory =
      historyRef.current.branchId === action.branchId ? historyRef.current.actions : [];
    const nextHistory = updateHistoryForAction(currentHistory, action);
    historyRef.current = { branchId: action.branchId, actions: nextHistory };
    setHistory(nextHistory);
  }, []);

  // PX-4a (ADR-PX4-1): direct play is the default; Strict mode is a per-viewer
  // preference kept in this browser. It must never be the only record of
  // anything, so a failed read simply starts in direct play.
  const [quickPlay, setQuickPlayState] = useState(() => {
    try {
      return window.localStorage.getItem(strictModeKey) !== "on";
    } catch {
      return true;
    }
  });
  const setQuickPlay = useCallback((enabled: boolean) => {
    setQuickPlayState(enabled);
    try {
      if (enabled) window.localStorage.removeItem(strictModeKey);
      else window.localStorage.setItem(strictModeKey, "on");
    } catch {
      // Storage unavailable: the setting lasts for this page only.
    }
  }, []);
  const [autoConfirmedIds, setAutoConfirmedIds] = useState<ReadonlySet<string>>(new Set());
  const [undoneIds, setUndoneIds] = useState<ReadonlySet<string>>(new Set());
  const autoConfirmAttempted = useRef(new Set<string>());

  const load = useCallback(
    async (initial: boolean): Promise<void> => {
      const generation = loadGeneration.current + 1;
      loadGeneration.current = generation;
      if (initial) setLoadState({ status: "loading" });
      setHistoryState("loading");

      const state = await readWorldState(continuityId);
      if (loadGeneration.current !== generation) return;
      if (state.status !== "ready") {
        setLoadState(state);
        setHistoryState("unavailable");
        return;
      }
      setLoadState(state);

      const historyResult = await readBranchHistoryResult(state.data.continuity.branchId);
      if (loadGeneration.current !== generation) return;
      if (!historyResult.available) {
        setHistoryState("unavailable");
        return;
      }
      setHistoryState("ready");
      const nextHistory =
        historyRef.current.branchId === state.data.continuity.branchId
          ? mergeBranchHistory(historyRef.current.actions, historyResult.actions)
          : historyResult.actions;
      historyRef.current = {
        branchId: state.data.continuity.branchId,
        actions: nextHistory,
      };
      setHistory(nextHistory);
      const pending = pendingHistory(nextHistory);
      const details = await Promise.all(
        pending.map(async (entry) => {
          try {
            const response = await fetch(`/v1/actions/${encodeURIComponent(entry.id)}`, {
              headers: { accept: "application/json" },
            });
            if (!response.ok) return null;
            return actionResponseSchema.parse(await response.json());
          } catch {
            return null;
          }
        }),
      );
      if (loadGeneration.current !== generation) return;
      setActions((current) => {
        let next = new Map(current);
        details.forEach((action) => {
          if (action && action.continuityId === continuityId) next = mergeAction(next, action);
        });
        actionsRef.current = next;
        return next;
      });
    },
    [continuityId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(true), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const refresh = useCallback(async (): Promise<void> => {
    await load(false);
  }, [load]);

  const readAction = useCallback(
    async (actionId: string): Promise<ActionResponse | null> => {
      const existing = actionsRef.current.get(actionId);
      try {
        const response = await fetch(`/v1/actions/${encodeURIComponent(actionId)}`, {
          headers: { accept: "application/json" },
        });
        if (!response.ok) return existing ?? null;
        const action = actionResponseSchema.parse(await response.json());
        if (
          action.continuityId !== continuityId ||
          (loadStateRef.current.status === "ready" &&
            action.branchId !== loadStateRef.current.data.continuity.branchId)
        )
          return null;
        if (existing && !shouldAcceptAction(existing.status, action.status)) return existing;
        upsertAction(action);
        return action;
      } catch {
        return existing ?? null;
      }
    },
    [continuityId, upsertAction],
  );

  const pendingActions = useMemo(
    () =>
      history
        .map((entry) => actions.get(entry.id))
        .filter((action): action is ActionResponse => Boolean(action))
        .filter((action) => !TERMINAL_ACTION_STATUSES.has(action.status)),
    [actions, history],
  );
  const pendingActionRefs = useMemo(() => pendingHistory(history), [history]);
  const pendingActionsRef = useRef<ActionResponse[]>(pendingActions);
  const pendingSubscriptionKey = pendingActions
    .filter((action) => action.status !== "CONFLICT")
    .map((action) => `${action.id}\u0000${action.eventsUrl}`)
    .sort()
    .join("\u0001");

  useEffect(() => {
    pendingActionsRef.current = pendingActions;
  }, [pendingActions]);

  useEffect(() => {
    if (pendingSubscriptionKey.length === 0) return;
    let active = true;
    const refreshPending = async (): Promise<void> => {
      const snapshot = [...pendingActionsRef.current];
      const nextActions = await Promise.all(
        snapshot.map(async (action) => {
          try {
            const response = await fetch(`/v1/actions/${encodeURIComponent(action.id)}`, {
              headers: { accept: "application/json" },
            });
            if (!response.ok) return null;
            return actionResponseSchema.parse(await response.json());
          } catch {
            return null;
          }
        }),
      );
      if (!active) return;
      let committed = false;
      nextActions.forEach((action) => {
        if (!action) return;
        if (action.status === "COMMITTED") committed = true;
        upsertAction(action);
      });
      if (committed) void refresh();
    };
    const timer = window.setInterval(() => void refreshPending(), 1000);
    const sources = snapshotEventSources(
      pendingActionsRef.current.filter((action) => action.status !== "CONFLICT"),
      () => void refreshPending(),
    );
    return () => {
      active = false;
      window.clearInterval(timer);
      sources.forEach((source) => source.close());
    };
  }, [pendingSubscriptionKey, refresh, upsertAction]);

  const submitAction = useCallback(
    async (
      rawIntent: string,
      targetCharacterId?: string,
      requestedEffect: RequestedEffect = "FACT_REWRITE",
      targetThreadId?: string,
    ): Promise<ActionResult> => {
      const normalizedIntent = rawIntent.trim();
      if (!normalizedIntent || loadState.status !== "ready") {
        return { action: null, error: t("Describe an Action in the current world first.") };
      }
      const branchId = loadState.data.continuity.branchId;
      const expectedHeadCommitId = loadState.data.continuity.headCommitId;
      const submissionKey = JSON.stringify([
        branchId,
        expectedHeadCommitId,
        normalizedIntent,
        targetCharacterId ?? null,
        requestedEffect,
        targetThreadId ?? null,
      ]);
      const existingAttempt = pendingSubmission.current.get(submissionKey);
      const submission = existingAttempt ?? {
        idempotencyKey: crypto.randomUUID(),
        intent: normalizedIntent,
        expectedHeadCommitId,
      };
      pendingSubmission.current.set(submissionKey, submission);
      try {
        const response = await fetch(`/v1/branches/${encodeURIComponent(branchId)}/actions`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            schemaVersion: 1,
            idempotencyKey: submission.idempotencyKey,
            expectedHeadCommitId,
            participationExpectation: loadState.data.state.participation,
            intent: normalizedIntent,
            ...(targetCharacterId ? { targetCharacterId } : {}),
            ...(requestedEffect !== "FACT_REWRITE" ? { requestedEffect } : {}),
            ...(targetThreadId ? { targetThreadId } : {}),
          }),
        });
        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            const refused = (await response.json().catch(() => null)) as {
              message?: string;
            } | null;
            pendingSubmission.current.delete(submissionKey);
            await refresh().catch(() => undefined);
            return {
              action: null,
              // SA-2: an addressed Character must know the fact this Action is about.
              error:
                targetCharacterId && refused?.message === characterKnowledgeRefusal
                  ? t(
                      "This character does not know anything this Action can be about yet. Give them knowledge of a fact in World Studio, or let the world respond.",
                    )
                  : t("The Action was not accepted. Review the current world and try again."),
            };
          }
          await refresh().catch(() => undefined);
          return {
            action: null,
            error: t(
              "The acknowledgement could not be confirmed. Current durable Action state was refreshed; retrying the same intent is safe.",
            ),
          };
        }
        const action = actionResponseSchema.parse(await response.json());
        pendingSubmission.current.delete(submissionKey);
        if (action.continuityId === continuityId) upsertAction(action);
        return { action, error: null };
      } catch {
        await refresh().catch(() => undefined);
        return {
          action: null,
          error: t(
            "The acknowledgement could not be confirmed. Current durable Action state was refreshed; retrying the same intent is safe.",
          ),
        };
      }
    },
    [continuityId, loadState, refresh, upsertAction],
  );

  const confirmAction = useCallback(
    async (action: ActionResponse): Promise<ActionResult> => {
      if (!action.proposal)
        return { action, error: t("This Action has no exact proposal to confirm.") };
      try {
        const response = await fetch(`/v1/actions/${encodeURIComponent(action.id)}/confirm`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            proposalId: action.proposal.id,
            proposalDigest: action.proposal.digest,
            expectedHeadCommitId: action.proposal.expectedHeadCommitId,
          }),
        });
        if (!response.ok) {
          const current = await readAction(action.id);
          return {
            action: current ?? action,
            error: ambiguousActionOutcome("confirmation", current),
          };
        }
        const next = actionResponseSchema.parse(await response.json());
        upsertAction(next);
        if (next.status === "COMMITTED") await refresh();
        return { action: next, error: null };
      } catch {
        const current = await readAction(action.id);
        return {
          action: current ?? action,
          error: ambiguousActionOutcome("confirmation", current),
        };
      }
    },
    [readAction, refresh, upsertAction],
  );

  // PX-4a direct play: the same exact confirmation the button sends, for every
  // play proposal, unless Strict mode is on. Corrections and removals always
  // wait for the player's own click (ADR-PX4-1).
  useEffect(() => {
    if (!quickPlay) return;
    for (const action of pendingActions) {
      if (
        action.operationType !== "PARTICIPATE" ||
        action.status !== "AWAITING_CONFIRMATION" ||
        !action.proposal ||
        autoConfirmAttempted.current.has(action.id)
      )
        continue;
      autoConfirmAttempted.current.add(action.id);
      void confirmAction(action).then((result) => {
        if (!result.error) setAutoConfirmedIds((current) => new Set([...current, action.id]));
      });
    }
  }, [confirmAction, pendingActions, quickPlay]);

  const undoAction = useCallback(
    async (action: ActionResponse): Promise<string | null> => {
      if (loadState.status !== "ready" || !action.proposal || !action.commit) {
        return t("This change can no longer be undone here.");
      }
      const branchId = loadState.data.continuity.branchId;
      const prepared = await prepareRestore(branchId, action.proposal.expectedHeadCommitId);
      const confirmed = prepared.data ? await confirmRestore(branchId, prepared.data) : null;
      if (confirmed?.data) setUndoneIds((current) => new Set([...current, action.id]));
      await refresh();
      return confirmed?.data
        ? null
        : t(
            "The change could not be undone. The world has changed since; open Recovery to choose a point.",
          );
    },
    [loadState, refresh],
  );

  const submitCorrection = useCallback(
    async (request: CorrectionRequest): Promise<CorrectionResult> => {
      if (loadState.status !== "ready") {
        return {
          action: null,
          status: 503,
          error: t("The current Branch head is not available for correction review."),
          errorCode: null,
        };
      }
      const result = await sendCorrection(loadState.data.continuity.branchId, request);
      if (result.data) {
        if (result.data.continuityId !== continuityId) {
          return {
            action: null,
            status: 502,
            error: t("The correction response did not belong to this Continuity."),
            errorCode: null,
          };
        }
        upsertAction(result.data);
        return {
          action: result.data,
          status: result.response.status,
          error: null,
          errorCode: null,
        };
      }
      return {
        action: null,
        status: result.response.status,
        errorCode: result.errorCode,
        error:
          result.errorCode === "NO_ACTIVE_CANONICAL_FACT"
            ? t(
                "This deterministic world adapter has no active canonical fact to correct yet. No Action was created and current truth is unchanged.",
              )
            : result.response.status === 409
              ? t(
                  "The current Branch head changed. No correction was applied; review the target again.",
                )
              : t("The correction could not be prepared. Current World truth is unchanged."),
      };
    },
    [continuityId, loadState, upsertAction],
  );

  const cancelAction = useCallback(
    async (action: ActionResponse): Promise<ActionResult> => {
      try {
        const response = await fetch(`/v1/actions/${encodeURIComponent(action.id)}/cancel`, {
          method: "POST",
          headers: { accept: "application/json" },
        });
        if (!response.ok) {
          const current = await readAction(action.id);
          return {
            action: current ?? action,
            error: ambiguousActionOutcome("cancellation", current),
          };
        }
        const next = actionResponseSchema.parse(await response.json());
        upsertAction(next);
        return { action: next, error: null };
      } catch {
        const current = await readAction(action.id);
        return {
          action: current ?? action,
          error: ambiguousActionOutcome("cancellation", current),
        };
      }
    },
    [readAction, upsertAction],
  );

  const retryAction = useCallback(
    async (action: ActionResponse): Promise<ActionResult> => {
      try {
        const response = await fetch(`/v1/actions/${encodeURIComponent(action.id)}/retry`, {
          method: "POST",
          headers: { accept: "application/json" },
        });
        if (!response.ok) {
          const current = await readAction(action.id);
          return {
            action: current ?? action,
            error: ambiguousActionOutcome("retry", current),
          };
        }
        const next = actionResponseSchema.parse(await response.json());
        upsertAction(next);
        return { action: next, error: null };
      } catch {
        const current = await readAction(action.id);
        return {
          action: current ?? action,
          error: ambiguousActionOutcome("retry", current),
        };
      }
    },
    [readAction, upsertAction],
  );

  const value = useMemo<ContinuityContextValue>(
    () => ({
      continuityId,
      historyState,
      loadState,
      history,
      actions,
      pendingActions,
      pendingActionRefs,
      selectedActionId,
      setSelectedActionId,
      refresh,
      readAction,
      submitAction,
      submitCorrection,
      confirmAction,
      cancelAction,
      retryAction,
      quickPlay,
      setQuickPlay,
      autoConfirmedIds,
      undoneIds,
      undoAction,
    }),
    [
      autoConfirmedIds,
      undoneIds,
      quickPlay,
      setQuickPlay,
      undoAction,
      actions,
      cancelAction,
      confirmAction,
      continuityId,
      history,
      historyState,
      loadState,
      pendingActionRefs,
      pendingActions,
      readAction,
      refresh,
      retryAction,
      selectedActionId,
      submitAction,
      submitCorrection,
    ],
  );

  return <ContinuityContext.Provider value={value}>{children}</ContinuityContext.Provider>;
}

export function useContinuity(): ContinuityContextValue {
  const value = useContext(ContinuityContext);
  if (!value) throw new Error("useContinuity must be used inside ContinuityProvider");
  return value;
}

export function ContinuityLayout(): ReactElement {
  const { continuityId } = useParams<{ continuityId: string }>();
  if (!continuityId) {
    return (
      <StatusPage title={t("This path is incomplete")} copy={t("A Continuity id is required.")} />
    );
  }
  return (
    <ContinuityProvider key={continuityId} continuityId={continuityId}>
      <ContinuityFrame />
    </ContinuityProvider>
  );
}

function ContinuityFrame(): ReactElement {
  const { continuityId, historyState, loadState, pendingActions, pendingActionRefs } =
    useContinuity();
  const title = loadState.status === "ready" ? loadState.data.world.title : t("Current world");
  const basePath = `/continuities/${encodeURIComponent(continuityId)}`;
  return (
    <div className="continuity-shell">
      <header className="continuity-header">
        <Link className="wordmark" to="/" aria-label={t("Simulora home")}>
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>{t("Simulora")}</span>
        </Link>
        <div className="continuity-heading">
          <span>{title}</span>
          {loadState.status === "ready" ? (
            <span className="source-chip">
              {t("Revision")} {loadState.data.continuity.worldRevisionNumber} {t("· current path")}
            </span>
          ) : null}
        </div>
        <nav className="surface-nav" aria-label={t("Current world navigation")}>
          <NavLink to={basePath} end>
            {t("World")}
          </NavLink>
          <NavLink to={`${basePath}/return`}>{t("Return")}</NavLink>
          <NavLink to={`${basePath}/continuity`}>{t("Continuity")}</NavLink>
          <NavLink to={`${basePath}/context`}>{t("Context")}</NavLink>
        </nav>
      </header>
      {historyState === "unavailable" ? (
        <PendingHistoryUnavailableNotice />
      ) : pendingActionRefs.length > 0 ? (
        <PendingActionRibbon
          basePath={basePath}
          pendingActions={pendingActions}
          pendingActionRefs={pendingActionRefs}
        />
      ) : null}
      <main id="main-content" className="continuity-main">
        <Outlet />
      </main>
    </div>
  );
}

function PendingHistoryUnavailableNotice(): ReactElement {
  const { refresh } = useContinuity();
  return (
    <aside
      className="pending-ribbon pending-ribbon-unavailable"
      aria-label={t("Pending Actions unavailable")}
      role="region"
      aria-live="polite"
    >
      <div>
        <strong>{t("Pending Action list is unavailable")}</strong>
        <span>{t("No durable Action was discarded. Recover Branch history before acting.")}</span>
      </div>
      <button className="secondary-action" type="button" onClick={() => void refresh()}>
        {t("Retry pending list")}
      </button>
    </aside>
  );
}

function PendingActionRibbon({
  basePath,
  pendingActions,
  pendingActionRefs,
}: {
  basePath: string;
  pendingActions: ActionResponse[];
  pendingActionRefs: BranchAction[];
}): ReactElement {
  return (
    <aside
      className="pending-ribbon"
      aria-label={t("Pending Action notice")}
      role="region"
      aria-live="polite"
    >
      <div>
        <strong>
          {pendingActionRefs.length === 1
            ? t("One Action still needs attention")
            : t("{count} Actions still need attention", { count: pendingActionRefs.length })}
        </strong>
        <span>{t("Pending work remains visible while you inspect this path.")}</span>
      </div>
      <div className="pending-ribbon-links">
        {pendingActionRefs.map((entry) => {
          const action = pendingActions.find((candidate) => candidate.id === entry.id);
          return (
            <Link key={entry.id} to={`${basePath}/actions/${encodeURIComponent(entry.id)}`}>
              {action ? `${labelMode(action.status)} · ` : t("Review Action · ")}
              {entry.intent}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export function SurfaceHeader({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  children?: ReactNode;
}): ReactElement {
  const { continuityId } = useContinuity();
  const basePath = `/continuities/${encodeURIComponent(continuityId)}`;
  return (
    <header className="surface-header">
      <div>
        <Link className="back-link" to={basePath}>
          {t("← Back to world")}
        </Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {copy ? <p className="surface-copy">{copy}</p> : null}
      </div>
      {children}
    </header>
  );
}

export function ActionStatusCard({
  action,
  onConfirm,
  onCancel,
  onRetry,
  onUndo,
  appliedAutomatically = false,
  undone = false,
  compact = false,
}: {
  action: ActionResponse;
  onConfirm?: (action: ActionResponse) => Promise<ActionResult>;
  onCancel?: (action: ActionResponse) => Promise<ActionResult>;
  onRetry?: (action: ActionResponse) => Promise<ActionResult>;
  /** PX-2a: offered only while this Action's Commit is still the head. */
  onUndo?: (action: ActionResponse) => Promise<string | null>;
  appliedAutomatically?: boolean;
  /** PX-2a review I-1: the world went back, but the story keeps what was said. */
  undone?: boolean;
  compact?: boolean;
}): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const loadState = useContext(ContinuityContext)?.loadState;
  const world = loadState?.status === "ready" ? loadState.data : null;
  const copy: Record<ActionResponse["status"], string> = {
    ACKNOWLEDGED: t("Received and durably recorded. The world has not changed yet."),
    GENERATING: action.recoverableWait
      ? t(
          "This response needs another bounded generation attempt. You can leave and return with this Action ID; current truth is unchanged.",
        )
      : t("The world is preparing a provisional response. Nothing has been recorded yet."),
    VALIDATING: t("Checking the proposed consequence against current World truth and authority."),
    AWAITING_CONFIRMATION: t("Here is what would happen. Nothing changes until you confirm it."),
    COMMITTING: t("Confirmed. Recording the change…"),
    COMMITTED: t("Done. This is now part of your story."),
    COMPLETED_NO_EFFECT: t("The world answered. Nothing in the world changed."),
    FAILED_RECOVERABLE:
      action.statusReason === "NO_WORLD_EFFECT"
        ? t("No world change recorded; response not committed. Close this Action to continue.")
        : t("The Action did not complete. Current truth is unchanged and it can be retried."),
    CONFLICT: t(
      "The world changed before this proposal could be recorded. Nothing was applied; this stale proposal remains until you close it.",
    ),
    CANCELLED: t("Cancelled. Current World truth is unchanged."),
    SUPERSEDED: t("This Action was replaced without changing current truth."),
  };
  const run = async (handler: ((action: ActionResponse) => Promise<ActionResult>) | undefined) => {
    if (!handler) return;
    setWorking(true);
    setError(null);
    try {
      const result = await handler(action);
      if (result.error) setError(result.error);
    } catch {
      setError(
        t(
          "The Action response was not acknowledged. Recover its durable status before trying again; current truth may have changed.",
        ),
      );
    } finally {
      setWorking(false);
    }
  };
  return (
    <article
      className={`action-status action-status-${action.status.toLowerCase()}${compact ? " compact" : ""}`}
      aria-labelledby={`action-status-${action.id}`}
    >
      <p className="card-label">
        {t("Action status ·")} {action.id.slice(0, 8)}
      </p>
      <p className="action-intent">{action.intent}</p>
      <h2 id={`action-status-${action.id}`}>{labelMode(action.status)}</h2>
      <p>{copy[action.status]}</p>
      {action.generation?.fallbackFrom ? (
        <p className="action-note">
          {t(
            "The primary model was unavailable, so this response came from the declared fallback profile. It passed the same checks, and nothing is recorded until you confirm.",
          )}
        </p>
      ) : null}
      {action.proposal && action.status === "AWAITING_CONFIRMATION" ? (
        <div className="proposal-review">
          <p className="proposal-label">{t("Provisional — not current truth")}</p>
          {action.proposal.responseSource ? (
            <p className="card-label">
              {action.proposal.responseSource.type === "CHARACTER"
                ? `${t("Character response")} · ${characterName(action.proposal.responseSource.characterId, world)}`
                : t("World response")}
            </p>
          ) : null}
          <p>{action.proposal.narrative}</p>
          {action.proposal.displayEffects ? (
            // PX-4b: a turn with several changes lists each one.
            <>
              <ol className="turn-changes">
                {action.proposal.displayEffects.map((effect) => (
                  <li key={effect.target}>{describeEffect(effect, action.id, world)}</li>
                ))}
              </ol>
              <dl>
                <div>
                  <dt>{t("Size of change")}</dt>
                  <dd>
                    {action.proposal.impact === "L3"
                      ? t("An important change — review it carefully")
                      : t("A small, everyday change")}
                  </dd>
                </div>
              </dl>
            </>
          ) : action.proposal.displayEffect.target === `fact.${action.id}` ||
            isRevealProposal(action.proposal, world?.world) ? (
            // WD-1a/WD-1b: an added or revealed fact has no earlier state to show.
            <dl>
              <div>
                <dt>
                  {isRevealProposal(action.proposal, world?.world)
                    ? t("Discovered")
                    : t("New in the world")}
                </dt>
                <dd>{action.proposal.displayEffect.after}</dd>
              </div>
              <div>
                <dt>{t("Size of change")}</dt>
                <dd>{t("A small, everyday change")}</dd>
              </div>
            </dl>
          ) : (
            <dl>
              <div>
                <dt>{t("Affects")}</dt>
                <dd>{describeTarget(action.proposal.displayEffect.target, world)}</dd>
              </div>
              <div>
                <dt>
                  {action.proposal.displayEffect.target.startsWith("constraint.")
                    ? t("The attempt fails")
                    : t("Current")}
                </dt>
                <dd>{action.proposal.displayEffect.before}</dd>
              </div>
              <div>
                <dt>
                  {action.proposal.displayEffect.target.startsWith("constraint.")
                    ? t("New open thread")
                    : t("If confirmed")}
                </dt>
                <dd>{action.proposal.displayEffect.after}</dd>
              </div>
              <div>
                <dt>{t("Size of change")}</dt>
                <dd>
                  {action.proposal.impact === "L3"
                    ? t("An important change — review it carefully")
                    : t("A small, everyday change")}
                </dd>
              </div>
              <div>
                <dt>{t("Scope")}</dt>
                <dd>{labelMode(action.proposal.displayEffect.scope)}</dd>
              </div>
            </dl>
          )}
        </div>
      ) : null}
      {undone && action.status === "COMMITTED" ? (
        <p className="action-note">
          {t(
            "Undone. The world is back to how it was before this change; what was said stays in the story.",
          )}
        </p>
      ) : null}
      {appliedAutomatically && action.status === "COMMITTED" ? (
        <p className="action-note">{t("Applied at once. You can undo this turn.")}</p>
      ) : null}
      {action.proposal && action.status === "COMMITTED" ? (
        <div className="proposal-review">
          {action.proposal.responseSource ? (
            <p className="card-label">
              {action.proposal.responseSource.type === "CHARACTER"
                ? `${t("Character response")} · ${characterName(action.proposal.responseSource.characterId, world)}`
                : t("World response")}
            </p>
          ) : null}
          <p>{action.proposal.narrative}</p>
          {/* PX-4a: with no confirmation step, the result names what changed. */}
          <p className="turn-change">
            <strong>{t("This turn changed:")}</strong>{" "}
            {action.proposal.displayEffects ? (
              action.proposal.displayEffects.map((effect, index) => (
                <span key={effect.target}>
                  {index > 0 ? "; " : null}
                  {describeEffect(effect, action.id, world)}
                </span>
              ))
            ) : action.proposal.displayEffect.target === `fact.${action.id}` ? (
              <>
                {t("New in the world")}: {action.proposal.displayEffect.after}
              </>
            ) : isRevealProposal(action.proposal, world?.world) ? (
              <>
                {t("Discovered")}: {action.proposal.displayEffect.after}
              </>
            ) : (
              <>
                {describeTarget(action.proposal.displayEffect.target, world)}:{" "}
                {action.proposal.displayEffect.before} → {action.proposal.displayEffect.after}
              </>
            )}
          </p>
        </div>
      ) : null}
      {action.dialogue && action.status === "COMPLETED_NO_EFFECT" ? (
        <div className="proposal-review">
          <p className="proposal-label">{t("Nothing in the world changed")}</p>
          <p className="card-label">
            {action.dialogue.responseSource.type === "CHARACTER"
              ? `${t("Character response")} · ${characterName(action.dialogue.responseSource.characterId, world)}`
              : t("World response")}
          </p>
          <p>{action.dialogue.narrative}</p>
          <p className="muted-copy">
            {t("Source:")} {action.dialogue.provenance}
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="action-error" role="alert">
          {error}
        </p>
      ) : null}
      {action.status === "AWAITING_CONFIRMATION" ? (
        <div className="action-buttons">
          <button
            className="primary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onConfirm)}
          >
            {t("Confirm this exact change")}
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onCancel)}
          >
            {t("Cancel Action")}
          </button>
        </div>
      ) : null}
      {["ACKNOWLEDGED", "GENERATING", "VALIDATING"].includes(action.status) ? (
        <button
          className="secondary-action"
          type="button"
          disabled={working}
          onClick={() => void run(onCancel)}
        >
          {t("Cancel Action")}
        </button>
      ) : null}
      {action.status === "FAILED_RECOVERABLE" ? (
        <div className="action-buttons">
          <button
            className="primary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onRetry)}
          >
            {t("Retry this Action")}
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onCancel)}
          >
            {t("Cancel Action")}
          </button>
        </div>
      ) : null}
      {onUndo && action.status === "COMMITTED" ? (
        <div className="action-buttons">
          <button
            className="secondary-action"
            type="button"
            disabled={working}
            onClick={() => {
              setWorking(true);
              setError(null);
              void onUndo(action).then((failure) => {
                setWorking(false);
                if (failure) setError(failure);
              });
            }}
          >
            {t("Undo this turn")}
          </button>
          <p className="muted-copy">
            {t(
              "Undo returns the world to how it was before this change. What was said stays in the story.",
            )}
          </p>
        </div>
      ) : null}
      {action.status === "CONFLICT" ? (
        <div className="action-buttons">
          <button
            className="secondary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onCancel)}
          >
            {t("Close stale Action")}
          </button>
          <p className="muted-copy">
            {t(
              "This supersedes only the stale proposal. Current truth and its history remain unchanged; you can then submit a new Action against the current world.",
            )}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function WorldContextSummary(): ReactElement {
  const { continuityId, historyState, loadState, pendingActionRefs } = useContinuity();
  if (loadState.status !== "ready") {
    return (
      <StatusPage
        title={t("Loading current context…")}
        copy={t("Reading the current Branch head.")}
      />
    );
  }
  const { data } = loadState;
  return (
    <aside className="world-context" aria-label={t("Current world context")}>
      <section>
        <h2>{t("What is true now")}</h2>
        <ul className="truth-list">
          {data.state.facts
            .filter((fact) => isCurrentFactValue(fact) && !isHiddenSecret(data.world, fact))
            .map((fact, index) => {
              const item = asRecord(fact);
              const statement = readText(item, "statement") ?? `${t("Current fact")} ${index + 1}`;
              return <li key={readText(item, "id") ?? statement}>{statement}</li>;
            })}
        </ul>
      </section>
      <section>
        <h2>{t("Present here")}</h2>
        {data.state.characters.map((character, index) => {
          const item = asRecord(character);
          const characterId = readText(item, "id");
          const spec = data.world.characters.find((candidate) => candidate.id === characterId);
          return (
            <article className="character-card" key={characterId ?? index}>
              <strong>{readText(item, "name") ?? t("Present character")}</strong>
              <span>{readText(item, "role") ?? t("Current stance")}</span>
              <small>{readText(item, "currentState") ?? t("Current state is available.")}</small>
              {spec ? <small>{spec.stance}</small> : null}
            </article>
          );
        })}
      </section>
      {data.state.threads?.length ? (
        <section>
          <h2>{t("Story threads")}</h2>
          <ul className="truth-list" aria-label={t("Story threads")}>
            {data.state.threads.map((thread) => (
              <li key={thread.id}>
                <strong>{thread.status === "OPEN" ? t("Open") : t("Resolved")}</strong> ·{" "}
                {thread.title}
                {thread.resolution ? <small> — {thread.resolution}</small> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {data.state.relationships.some((item) => readText(asRecord(item), "state")) ? (
        <section>
          <h2>{t("Relationships")}</h2>
          <ul className="truth-list" aria-label={t("Relationships")}>
            {data.state.relationships.map((relationship, index) => {
              const item = asRecord(relationship);
              const current = readText(item, "state");
              return current ? (
                <li key={readText(item, "id") ?? index}>
                  {readText(item, "description") ?? t("A relationship")} ·{" "}
                  <strong>{current}</strong>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      ) : null}
      <section className="authority-note">
        <h2>{t("Participation")}</h2>
        <p>
          {labelMode(data.state.participation.initiativeMode)} ·{" "}
          {labelMode(data.state.participation.structureMode)}
        </p>
        <small>
          {t("Only a confirmed server Commit advances this world. Provisional output does not.")}
        </small>
        <Link
          className="text-action"
          to={`/continuities/${encodeURIComponent(continuityId)}/participation`}
        >
          {t("Change participation contract")}
        </Link>
      </section>
      {pendingActionRefs.length > 0 ? (
        <section className="pending-context-note">
          <h2>{t("Pending work")}</h2>
          <p>
            {pendingActionRefs.length}{" "}
            {t("Action(s) remain unresolved. They are not current truth.")}
          </p>
        </section>
      ) : null}
      {historyState === "unavailable" ? (
        <section className="pending-context-note" aria-live="polite">
          <h2>{t("Pending work unavailable")}</h2>
          <p>
            {t(
              "The durable Branch Action list could not be read. No Action was discarded, and new Actions stay paused until it is recovered.",
            )}
          </p>
        </section>
      ) : null}
      <Link
        className="secondary-action inline-action recovery-entry"
        to={`/continuities/${encodeURIComponent(continuityId)}/recovery`}
      >
        {t("Open Recovery")}
      </Link>
    </aside>
  );
}

export function StatusPage({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <section className="status-page" aria-live="polite">
      <p className="eyebrow">{t("Simulora")}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
      {children}
    </section>
  );
}

export function labelMode(value: string): string {
  return t(
    value
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/^./, (letter) => letter.toUpperCase()),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** WD-1b: an author's secret stays out of the player's view until play reveals it. */
export function isHiddenSecret(world: AuthoritativeStateResponse["world"], fact: unknown): boolean {
  const item = asRecord(fact);
  const id = readText(item, "id");
  return (
    item?.scope === "CONTINUITY_PRIVATE" &&
    (world.discoverableFacts ?? []).some((secret) => secret.factId === id)
  );
}

/**
 * PX-4b: one change of a multi-change turn, in the words the single-change
 * line uses. A new fact carries its position (`fact.<action>.<n>`); a reveal
 * shows no earlier statement.
 */
function describeEffect(
  effect: { target: string; before: string; after: string },
  actionId: string,
  world: AuthoritativeStateResponse | null,
): ReactNode {
  if (effect.target.startsWith(`fact.${actionId}.`)) {
    return (
      <>
        {t("New in the world")}: {effect.after}
      </>
    );
  }
  if (
    effect.before === "Hidden until now." &&
    (world?.world?.discoverableFacts ?? []).some((secret) => secret.factId === effect.target)
  ) {
    return (
      <>
        {t("Discovered")}: {effect.after}
      </>
    );
  }
  return (
    <>
      {describeTarget(effect.target, world)}: {effect.before} → {effect.after}
    </>
  );
}

/**
 * WD-1b: only a reveal is an L2 change to a declared secret; rewriting a
 * revealed fact is always L3.
 */
function isRevealProposal(
  proposal: { impact: string; displayEffect: { target: string } },
  world: AuthoritativeStateResponse["world"] | null | undefined,
): boolean {
  return (
    proposal.impact === "L2" &&
    (world?.discoverableFacts ?? []).some(
      (secret) => secret.factId === proposal.displayEffect.target,
    )
  );
}

function isCurrentFactValue(value: unknown): boolean {
  const lifecycle = asRecord(value)?.lifecycle;
  return lifecycle === undefined || lifecycle === "ACTIVE";
}

export function readText(value: Record<string, unknown> | null, key: string): string | null {
  const candidate = value?.[key];
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

function snapshotEventSources(actions: ActionResponse[], onEvent: () => void): EventSource[] {
  return actions.flatMap((action) => {
    try {
      const source = new EventSource(action.eventsUrl);
      source.onmessage = onEvent;
      source.addEventListener("action.status", onEvent);
      source.addEventListener("confirmation.required", onEvent);
      source.addEventListener("action.committed", onEvent);
      source.addEventListener("action.failed", onEvent);
      return [source];
    } catch {
      return [];
    }
  });
}

/** A Character's declared name; identifiers are never shown as if they were names. */
function characterName(id: string, world: AuthoritativeStateResponse | null): string {
  return world?.world.characters.find((character) => character.id === id)?.name ?? t("Character");
}

/** Plain words for what a proposal would change; never a raw identifier. */
export function describeTarget(target: string, world: AuthoritativeStateResponse | null): string {
  const [kind] = target.split(".");
  if (kind === "thread") return t("Story thread");
  if (kind === "character") return `${t("Character")} · ${characterName(target, world)}`;
  const relationship = world?.world.relationships.find((item) => item.id === target);
  if (relationship)
    return `${t("Relationship")} · ${characterName(relationship.fromCharacterId, world)} ${t("and")} ${characterName(relationship.toCharacterId, world)}`;
  const constraint = world?.world.constraints?.find((item) => item.id === target);
  if (constraint) return `${t("World constraint")} · ${constraint.statement}`;
  if (kind === "relationship") return t("Relationship");
  if (kind === "constraint") return t("World constraint");
  return t("World fact");
}

export function ActionComposer(): ReactElement {
  const { historyState, loadState, pendingActionRefs, submitAction, quickPlay, setQuickPlay } =
    useContinuity();
  const [intent, setIntent] = useState("");
  const [targetCharacterId, setTargetCharacterId] = useState("");
  // "THREAD_EFFECT:<id>" asks to work toward resolving that open thread.
  // WD-1b: the story decides by default; it never makes an important change.
  const [effectChoice, setEffectChoice] = useState<string>("STORY_DECIDES");
  const [requestedEffect, targetThreadId] = effectChoice.startsWith("THREAD_EFFECT:")
    ? (["THREAD_EFFECT", effectChoice.slice("THREAD_EFFECT:".length)] as const)
    : ([effectChoice as RequestedEffect, undefined] as const);
  const setRequestedEffect = setEffectChoice;
  const openThreads =
    loadState.status === "ready"
      ? (loadState.data.state.threads ?? []).filter((thread) => thread.status === "OPEN")
      : [];
  // SA-2: movement is offered only to Characters the Revision's policy lets move.
  const routineMoverIds = loadState.status === "ready" ? loadState.data.routineMoverIds : undefined;
  const canMove =
    Boolean(targetCharacterId) &&
    (routineMoverIds === undefined || routineMoverIds.includes(targetCharacterId));
  const canShiftRelationship =
    loadState.status === "ready" &&
    Boolean(targetCharacterId) &&
    scaledRelationshipsOf(loadState.data.state, targetCharacterId).length > 0;
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const hasUnresolvedAction = pendingActionRefs.length > 0;
  const historyUnavailable = historyState === "unavailable";
  const historyLoading = historyState === "loading";
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (working || !intent.trim() || hasUnresolvedAction || historyState !== "ready") return;
    if (
      (requestedEffect === "ROUTINE_EFFECT" || requestedEffect === "RELATIONSHIP_EFFECT") &&
      !targetCharacterId
    ) {
      setError(t("Choose a character first."));
      return;
    }
    if (requestedEffect === "ROUTINE_EFFECT" && !canMove) {
      setError(t("This character cannot move on their own in this World."));
      return;
    }
    setWorking(true);
    setError(null);
    const result = await submitAction(
      intent,
      targetCharacterId || undefined,
      requestedEffect,
      targetThreadId,
    );
    setWorking(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setIntent("");
  };
  return (
    <section className="action-zone" aria-labelledby="action-title">
      <div className="action-heading">
        <div>
          <p className="card-label">{t("Participation")}</p>
          <h2 id="action-title">{t("What do you do?")}</h2>
        </div>
        {loadState.status === "ready" ? (
          <span>{labelMode(loadState.data.state.participation.initiativeMode)}</span>
        ) : null}
      </div>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="action-character">{t("Address a character")}</label>
        <select
          id="action-character"
          value={targetCharacterId}
          onChange={(event) => {
            const nextCharacterId = event.target.value;
            setTargetCharacterId(nextCharacterId);
            if (requestedEffect === "ROUTINE_EFFECT" || requestedEffect === "RELATIONSHIP_EFFECT") {
              // A character-bound outcome never carries over to another character.
              setRequestedEffect("STORY_DECIDES");
            }
          }}
          disabled={
            working ||
            hasUnresolvedAction ||
            historyState !== "ready" ||
            loadState.status !== "ready"
          }
        >
          <option value="">{t("Let the world respond")}</option>
          {loadState.status === "ready"
            ? loadState.data.world.characters
                .filter((character) =>
                  loadState.data.state.characters.some(
                    (runtime) =>
                      readText(
                        typeof runtime === "object" && runtime !== null
                          ? (runtime as Record<string, unknown>)
                          : null,
                        "id",
                      ) === character.id,
                  ),
                )
                .map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))
            : null}
        </select>
        <label htmlFor="action-effect">{t("Desired outcome")}</label>
        <select
          id="action-effect"
          value={effectChoice}
          onChange={(event) => setRequestedEffect(event.target.value)}
          disabled={
            working ||
            hasUnresolvedAction ||
            historyState !== "ready" ||
            loadState.status !== "ready"
          }
        >
          <option value="STORY_DECIDES">{t("Let the story decide")}</option>
          <option value="NO_WORLD_EFFECT">{t("Just talk or look — nothing changes")}</option>
          <option value="FACT_REWRITE">{t("Change something in the world")}</option>
          <option value="ROUTINE_EFFECT" disabled={!canMove}>
            {t("Have this character move")}
          </option>
          <option value="RELATIONSHIP_EFFECT" disabled={!canShiftRelationship}>
            {t("Change how this character relates to someone")}
          </option>
          <option value="THREAD_EFFECT">{t("Start a new story thread")}</option>
          {openThreads.map((thread) => (
            <option key={thread.id} value={`THREAD_EFFECT:${thread.id}`}>
              {t("Work toward resolving:")} {thread.title}
            </option>
          ))}
        </select>
        <p className="field-help">
          {quickPlay
            ? t("What you do changes the world at once. You can undo the latest turn.")
            : t("Strict mode: every change to the world waits for your confirmation.")}
        </p>
        <label className="quick-play-toggle">
          <input
            type="checkbox"
            checked={!quickPlay}
            onChange={(event) => setQuickPlay(!event.target.checked)}
          />
          {t("Strict mode: confirm every change myself")}
        </label>
        <label htmlFor="world-action">{t("Your Action")}</label>
        <textarea
          id="world-action"
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          disabled={
            working ||
            hasUnresolvedAction ||
            historyState !== "ready" ||
            loadState.status !== "ready"
          }
          placeholder={t("Describe one action in the current world…")}
          rows={3}
        />
        <button
          className="primary-action"
          type="submit"
          disabled={
            working ||
            !intent.trim() ||
            hasUnresolvedAction ||
            historyState !== "ready" ||
            loadState.status !== "ready"
          }
        >
          {working ? t("Sending…") : t("Send Action")}
        </button>
      </form>
      {hasUnresolvedAction ? (
        <p className="pending-composer-note">
          {t(
            "Resolve the pending Action(s) above before starting another ordinary Action. Correction review remains available from the relevant fact.",
          )}
        </p>
      ) : null}
      {historyLoading ? (
        <p className="pending-composer-note">{t("Checking the durable pending Action list…")}</p>
      ) : null}
      {historyUnavailable ? (
        <p className="pending-composer-note">
          {t(
            "The durable pending Action list is unavailable. New Actions stay paused until Branch history is recovered.",
          )}
        </p>
      ) : null}
      {error ? (
        <p className="action-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function ActionList({ compact = false }: { compact?: boolean }): ReactElement {
  const {
    continuityId,
    historyState,
    pendingActions,
    pendingActionRefs,
    actions,
    confirmAction,
    cancelAction,
    retryAction,
    refresh,
  } = useContinuity();
  if (historyState === "loading") {
    return <p className="empty-state">{t("Checking the durable pending Action list…")}</p>;
  }
  if (historyState === "unavailable") {
    return (
      <div className="pending-list-unavailable" role="status" aria-live="polite">
        <p>
          {t(
            "The durable pending Action list is unavailable. No Action was discarded; recover Branch history before relying on this surface.",
          )}
        </p>
        <button className="secondary-action" type="button" onClick={() => void refresh()}>
          {t("Retry pending list")}
        </button>
      </div>
    );
  }
  if (pendingActionRefs.length === 0) {
    return <p className="empty-state">{t("No Action is currently waiting for a decision.")}</p>;
  }
  return (
    <div className="action-list" aria-label={t("Pending Action details")}>
      {pendingActionRefs.map((entry) => {
        const candidate = actions.get(entry.id);
        const action =
          pendingActions.find((item) => item.id === entry.id) ??
          (candidate && !TERMINAL_ACTION_STATUSES.has(candidate.status) ? candidate : undefined);
        return action ? (
          <ActionStatusCard
            key={entry.id}
            action={action}
            onConfirm={confirmAction}
            onCancel={cancelAction}
            onRetry={retryAction}
            compact={compact}
          />
        ) : (
          <article className="action-status action-status-unavailable" key={entry.id}>
            <p className="card-label">
              {t("Action reference ·")} {entry.id.slice(0, 8)}
            </p>
            <h2>{labelMode(entry.status)}</h2>
            <p>
              {entry.intent}{" "}
              {t(
                "— durable status details are temporarily unavailable. Current truth was not inferred or changed here.",
              )}
            </p>
            <Link
              className="secondary-action inline-action"
              to={`/continuities/${encodeURIComponent(continuityId)}/actions/${encodeURIComponent(entry.id)}`}
            >
              {t("Recover Action status")}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
