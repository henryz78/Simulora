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
  submitAction: (intent: string) => Promise<ActionResult>;
  submitCorrection: (request: CorrectionRequest) => Promise<CorrectionResult>;
  confirmAction: (action: ActionResponse) => Promise<ActionResult>;
  cancelAction: (action: ActionResponse) => Promise<ActionResult>;
  retryAction: (action: ActionResponse) => Promise<ActionResult>;
};

const TERMINAL_ACTION_STATUSES = new Set<ActionResponse["status"]>([
  "COMMITTED",
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
  // A retry is the one legal backwards-looking transition: a recoverable
  // failure can be reopened for generation. All other terminal states are
  // immutable and an older read must never regress them.
  if (previous === "FAILED_RECOVERABLE" && incoming === "GENERATING") return true;
  if (TERMINAL_ACTION_STATUSES.has(previous)) return false;
  if (TERMINAL_ACTION_STATUSES.has(incoming) || incoming === "FAILED_RECOVERABLE") return true;
  return ACTION_PROGRESS_RANK[incoming] > ACTION_PROGRESS_RANK[previous];
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
      narrative: null,
    },
  ];
}

function ambiguousActionOutcome(
  operation: "confirmation" | "cancellation" | "retry",
  current: ActionResponse | null,
): string {
  if (current?.status === "COMMITTED") {
    return `The ${operation} response was lost, but this Action is durably committed. Read current state before taking another Action.`;
  }
  if (current && ["CONFLICT", "CANCELLED", "SUPERSEDED"].includes(current.status)) {
    return `The ${operation} response was lost; the durable Action status is ${labelMode(current.status)}. Re-read current state before continuing.`;
  }
  return `The ${operation} outcome is unknown. Recover this Action's status before retrying; current truth may have changed.`;
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

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);
  useEffect(() => {
    loadStateRef.current = loadState;
  }, [loadState]);

  const upsertAction = useCallback((action: ActionResponse): void => {
    setActions((current) => {
      const previous = current.get(action.id);
      if (previous && !shouldAcceptAction(previous.status, action.status)) return current;
      const next = new Map(current);
      next.set(action.id, action);
      return next;
    });
    setHistory((current) => updateHistoryForAction(current, action));
  }, []);

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
      const nextHistory = historyResult.actions;
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
        const next = new Map(current);
        details.forEach((action) => {
          if (action && action.continuityId === continuityId) next.set(action.id, action);
        });
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
    async (rawIntent: string): Promise<ActionResult> => {
      const normalizedIntent = rawIntent.trim();
      if (!normalizedIntent || loadState.status !== "ready") {
        return { action: null, error: "Describe an Action in the current world first." };
      }
      const branchId = loadState.data.continuity.branchId;
      const expectedHeadCommitId = loadState.data.continuity.headCommitId;
      const submissionKey = `${branchId}:${expectedHeadCommitId}:${normalizedIntent}`;
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
          }),
        });
        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            pendingSubmission.current.delete(submissionKey);
            return {
              action: null,
              error: "The Action was not accepted. Review the current world and try again.",
            };
          }
          return {
            action: null,
            error:
              "The acknowledgement could not be confirmed. Retry is safe and uses the same submission.",
          };
        }
        const action = actionResponseSchema.parse(await response.json());
        pendingSubmission.current.delete(submissionKey);
        if (action.continuityId === continuityId) upsertAction(action);
        return { action, error: null };
      } catch {
        return {
          action: null,
          error:
            "The acknowledgement could not be confirmed. Retry is safe and uses the same submission.",
        };
      }
    },
    [continuityId, loadState, upsertAction],
  );

  const confirmAction = useCallback(
    async (action: ActionResponse): Promise<ActionResult> => {
      if (!action.proposal)
        return { action, error: "This Action has no exact proposal to confirm." };
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

  const submitCorrection = useCallback(
    async (request: CorrectionRequest): Promise<CorrectionResult> => {
      if (loadState.status !== "ready") {
        return {
          action: null,
          status: 503,
          error: "The current Branch head is not available for correction review.",
          errorCode: null,
        };
      }
      const result = await sendCorrection(loadState.data.continuity.branchId, request);
      if (result.data) {
        if (result.data.continuityId !== continuityId) {
          return {
            action: null,
            status: 502,
            error: "The correction response did not belong to this Continuity.",
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
            ? "This deterministic world adapter has no active canonical fact to correct yet. No Action was created and current truth is unchanged."
            : result.response.status === 409
              ? "The current Branch head changed. No correction was applied; review the target again."
              : "The correction could not be prepared. Current World truth is unchanged.",
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
    }),
    [
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
    return <StatusPage title="This path is incomplete" copy="A Continuity id is required." />;
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
  const title = loadState.status === "ready" ? loadState.data.world.title : "Current world";
  const basePath = `/continuities/${encodeURIComponent(continuityId)}`;
  return (
    <div className="continuity-shell">
      <header className="continuity-header">
        <Link className="wordmark" to="/" aria-label="Simulora home">
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>Simulora</span>
        </Link>
        <div className="continuity-heading">
          <span>{title}</span>
          {loadState.status === "ready" ? (
            <span className="source-chip">
              Revision {loadState.data.continuity.worldRevisionNumber} · current path
            </span>
          ) : null}
        </div>
        <nav className="surface-nav" aria-label="Current world navigation">
          <NavLink to={basePath} end>
            World
          </NavLink>
          <NavLink to={`${basePath}/return`}>Return</NavLink>
          <NavLink to={`${basePath}/continuity`}>Continuity</NavLink>
          <NavLink to={`${basePath}/context`}>Context</NavLink>
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
      aria-label="Pending Actions unavailable"
      role="region"
      aria-live="polite"
    >
      <div>
        <strong>Pending Action list is unavailable</strong>
        <span>No durable Action was discarded. Recover Branch history before acting.</span>
      </div>
      <button className="secondary-action" type="button" onClick={() => void refresh()}>
        Retry pending list
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
    <aside className="pending-ribbon" aria-label="Pending Actions" role="region" aria-live="polite">
      <div>
        <strong>
          {pendingActionRefs.length === 1
            ? "One Action still needs attention"
            : `${pendingActionRefs.length} Actions still need attention`}
        </strong>
        <span>Pending work remains visible while you inspect this path.</span>
      </div>
      <div className="pending-ribbon-links">
        {pendingActionRefs.map((entry) => {
          const action = pendingActions.find((candidate) => candidate.id === entry.id);
          return (
            <Link key={entry.id} to={`${basePath}/actions/${encodeURIComponent(entry.id)}`}>
              {action ? `${labelMode(action.status)} · ` : "Review Action · "}
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
          ← Back to world
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
  compact = false,
}: {
  action: ActionResponse;
  onConfirm?: (action: ActionResponse) => Promise<ActionResult>;
  onCancel?: (action: ActionResponse) => Promise<ActionResult>;
  onRetry?: (action: ActionResponse) => Promise<ActionResult>;
  compact?: boolean;
}): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const copy: Record<ActionResponse["status"], string> = {
    ACKNOWLEDGED: "Received and durably recorded. The world has not changed yet.",
    GENERATING: action.recoverableWait
      ? "Still working. You can leave and return with this Action ID; current truth is unchanged."
      : "The world is preparing a provisional response. Nothing has been recorded yet.",
    VALIDATING: "Checking the proposed consequence against current World truth and authority.",
    AWAITING_CONFIRMATION:
      "Provisional proposal — review the exact effect before it can be recorded.",
    COMMITTING: "Confirmed. Recording one authoritative change…",
    COMMITTED: "Recorded. The Branch head and committed history now include this Action.",
    FAILED_RECOVERABLE:
      "The Action did not complete. Current truth is unchanged and it can be retried.",
    CONFLICT:
      "The world changed before this proposal could be recorded. Nothing was applied; this stale proposal remains until you close it.",
    CANCELLED: "Cancelled. Current World truth is unchanged.",
    SUPERSEDED: "This Action was replaced without changing current truth.",
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
        "The Action response was not acknowledged. Recover its durable status before trying again; current truth may have changed.",
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
      <p className="card-label">Action status · {action.id.slice(0, 8)}</p>
      <p className="action-intent">{action.intent}</p>
      <h2 id={`action-status-${action.id}`}>{labelMode(action.status)}</h2>
      <p>{copy[action.status]}</p>
      {action.proposal && action.status === "AWAITING_CONFIRMATION" ? (
        <div className="proposal-review">
          <p className="proposal-label">Provisional — not current truth</p>
          <p>{action.proposal.narrative}</p>
          <dl>
            <div>
              <dt>Current</dt>
              <dd>{action.proposal.displayEffect.before}</dd>
            </div>
            <div>
              <dt>If confirmed</dt>
              <dd>{action.proposal.displayEffect.after}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>{labelMode(action.proposal.displayEffect.scope)}</dd>
            </div>
          </dl>
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
            Confirm this exact change
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onCancel)}
          >
            Cancel Action
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
          Cancel Action
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
            Retry this Action
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={working}
            onClick={() => void run(onCancel)}
          >
            Cancel Action
          </button>
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
            Close stale Action
          </button>
          <p className="muted-copy">
            This supersedes only the stale proposal. Current truth and its history remain unchanged;
            you can then submit a new Action against the current world.
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function WorldContextSummary(): ReactElement {
  const { continuityId, historyState, loadState, pendingActionRefs } = useContinuity();
  if (loadState.status !== "ready") {
    return <StatusPage title="Loading current context…" copy="Reading the current Branch head." />;
  }
  const { data } = loadState;
  return (
    <aside className="world-context" aria-label="Current world context">
      <section>
        <h2>What is true now</h2>
        <ul className="truth-list">
          {data.state.facts.filter(isCurrentFactValue).map((fact, index) => {
            const item = asRecord(fact);
            const statement = readText(item, "statement") ?? `Current fact ${index + 1}`;
            return <li key={readText(item, "id") ?? statement}>{statement}</li>;
          })}
        </ul>
      </section>
      <section>
        <h2>Present here</h2>
        {data.state.characters.map((character, index) => {
          const item = asRecord(character);
          return (
            <article className="character-card" key={readText(item, "id") ?? index}>
              <strong>{readText(item, "name") ?? "Present character"}</strong>
              <span>{readText(item, "role") ?? "Current stance"}</span>
              <small>{readText(item, "currentState") ?? "Current state is available."}</small>
            </article>
          );
        })}
      </section>
      <section className="authority-note">
        <h2>Participation</h2>
        <p>
          {labelMode(data.state.participation.initiativeMode)} ·{" "}
          {labelMode(data.state.participation.structureMode)}
        </p>
        <small>
          Only a confirmed server Commit advances this world. Provisional output does not.
        </small>
      </section>
      {pendingActionRefs.length > 0 ? (
        <section className="pending-context-note">
          <h2>Pending work</h2>
          <p>{pendingActionRefs.length} Action(s) remain unresolved. They are not current truth.</p>
        </section>
      ) : null}
      {historyState === "unavailable" ? (
        <section className="pending-context-note" aria-live="polite">
          <h2>Pending work unavailable</h2>
          <p>
            The durable Branch Action list could not be read. No Action was discarded, and new
            Actions stay paused until it is recovered.
          </p>
        </section>
      ) : null}
      <Link
        className="secondary-action inline-action recovery-entry"
        to={`/continuities/${encodeURIComponent(continuityId)}/recovery`}
      >
        Open Recovery
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
      <p className="eyebrow">Simulora</p>
      <h1>{title}</h1>
      <p>{copy}</p>
      {children}
    </section>
  );
}

export function labelMode(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
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

export function ActionComposer(): ReactElement {
  const { historyState, loadState, pendingActionRefs, submitAction } = useContinuity();
  const [intent, setIntent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const hasUnresolvedAction = pendingActionRefs.length > 0;
  const historyUnavailable = historyState === "unavailable";
  const historyLoading = historyState === "loading";
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (working || !intent.trim() || hasUnresolvedAction || historyState !== "ready") return;
    setWorking(true);
    setError(null);
    const result = await submitAction(intent);
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
          <p className="card-label">Participation</p>
          <h2 id="action-title">What do you do?</h2>
        </div>
        {loadState.status === "ready" ? (
          <span>{labelMode(loadState.data.state.participation.initiativeMode)}</span>
        ) : null}
      </div>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="world-action">Your Action</label>
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
          placeholder="Describe one action in the current world…"
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
          {working ? "Sending…" : "Send Action"}
        </button>
      </form>
      {hasUnresolvedAction ? (
        <p className="pending-composer-note">
          Resolve the pending Action(s) above before starting another ordinary Action. Correction
          review remains available from the relevant fact.
        </p>
      ) : null}
      {historyLoading ? (
        <p className="pending-composer-note">Checking the durable pending Action list…</p>
      ) : null}
      {historyUnavailable ? (
        <p className="pending-composer-note">
          The durable pending Action list is unavailable. New Actions stay paused until Branch
          history is recovered.
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
    return <p className="empty-state">Checking the durable pending Action list…</p>;
  }
  if (historyState === "unavailable") {
    return (
      <div className="pending-list-unavailable" role="status" aria-live="polite">
        <p>
          The durable pending Action list is unavailable. No Action was discarded; recover Branch
          history before relying on this surface.
        </p>
        <button className="secondary-action" type="button" onClick={() => void refresh()}>
          Retry pending list
        </button>
      </div>
    );
  }
  if (pendingActionRefs.length === 0) {
    return <p className="empty-state">No Action is currently waiting for a decision.</p>;
  }
  return (
    <div className="action-list" aria-label="Pending Action details">
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
            <p className="card-label">Action reference · {entry.id.slice(0, 8)}</p>
            <h2>{labelMode(entry.status)}</h2>
            <p>
              {entry.intent} — durable status details are temporarily unavailable. Current truth was
              not inferred or changed here.
            </p>
            <Link
              className="secondary-action inline-action"
              to={`/continuities/${encodeURIComponent(continuityId)}/actions/${encodeURIComponent(entry.id)}`}
            >
              Recover Action status
            </Link>
          </article>
        );
      })}
    </div>
  );
}
