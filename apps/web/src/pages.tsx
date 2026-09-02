import { useEffect, useRef, useState, type FormEvent, type ReactElement } from "react";
import { Link, useParams } from "react-router";
import {
  authoritativeStateResponseSchema,
  actionResponseSchema,
  branchActionHistorySchema,
  type ActionResponse,
  type AuthoritativeStateResponse,
  type BranchActionHistory,
} from "@simulora/contracts";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: AuthoritativeStateResponse }
  | { status: "not-found" }
  | { status: "error" };

type PendingSubmission = {
  idempotencyKey: string;
  intent: string;
  expectedHeadCommitId: string;
};

async function readWorldState(continuityId: string | undefined): Promise<LoadState> {
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

export function FoundationPage(): ReactElement {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Simulora home">
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>Simulora</span>
        </Link>
        <span className="phase-badge">IP-3 · Action Truth</span>
      </header>
      <main id="main-content" className="foundation-main">
        <section className="hero" aria-labelledby="foundation-title">
          <p className="eyebrow">Production implementation</p>
          <h1 id="foundation-title">A durable world begins with a known source of truth.</h1>
          <p className="hero-copy">
            IP-3 adds durable Actions to the authoritative World spine. Received, provisional,
            confirmation and recorded states remain visibly distinct, and only a server Commit can
            advance current truth.
          </p>
        </section>
        <section className="boundary-panel" aria-labelledby="current-boundary">
          <h2 id="current-boundary">Current implementation boundary</h2>
          <ul>
            <li>World and current Continuity state are server-authoritative.</li>
            <li>Existing Continuities remain pinned to their starting World Revision.</li>
            <li>Deterministic Action generation is available; live models are not connected.</li>
            <li>Return, Correction, Recovery and World Studio remain outside this phase.</li>
          </ul>
        </section>
      </main>
      <footer className="site-footer">Product Implementation · IP-3 Action Truth</footer>
    </div>
  );
}

export function WorldPage(): ReactElement {
  const { continuityId } = useParams<{ continuityId: string }>();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [history, setHistory] = useState<BranchActionHistory["actions"]>([]);
  const [currentAction, setCurrentAction] = useState<ActionResponse | null>(null);
  const [intent, setIntent] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const pendingSubmission = useRef<PendingSubmission | null>(null);
  const readyBranchId =
    loadState.status === "ready" ? loadState.data.continuity.branchId : undefined;
  const currentActionId = currentAction?.id;
  const currentActionStatus = currentAction?.status;
  const currentActionEventsUrl = currentAction?.eventsUrl;

  useEffect(() => {
    void readWorldState(continuityId).then(setLoadState);
  }, [continuityId]);

  useEffect(() => {
    if (!readyBranchId) return;
    void readBranchHistory(readyBranchId)
      .then(async (actions) => {
        setHistory(actions);
        const pending = [...actions]
          .reverse()
          .find((action) => !["COMMITTED", "CANCELLED", "SUPERSEDED"].includes(action.status));
        if (pending) {
          const response = await fetch(`/v1/actions/${encodeURIComponent(pending.id)}`, {
            headers: { accept: "application/json" },
          });
          if (response.ok) setCurrentAction(actionResponseSchema.parse(await response.json()));
        }
      })
      .catch(() => undefined);
  }, [readyBranchId]);

  useEffect(() => {
    if (
      !currentActionId ||
      !currentActionEventsUrl ||
      !currentActionStatus ||
      ["COMMITTED", "CONFLICT", "CANCELLED", "SUPERSEDED"].includes(currentActionStatus)
    ) {
      return;
    }
    let active = true;
    const refresh = async (): Promise<void> => {
      try {
        const response = await fetch(`/v1/actions/${encodeURIComponent(currentActionId)}`);
        if (!response.ok) return;
        const next = actionResponseSchema.parse(await response.json());
        if (!active) return;
        setCurrentAction(next);
        if (next.status === "COMMITTED" && readyBranchId) {
          const [world, actionHistory] = await Promise.all([
            readWorldState(continuityId),
            readBranchHistory(readyBranchId),
          ]);
          if (active) {
            setLoadState(world);
            setHistory(actionHistory);
          }
        }
      } catch {
        // The durable Action ID remains visible and polling will retry. A transient
        // read failure is not presented as a completed or lost Action.
      }
    };
    const timer = window.setInterval(() => void refresh(), 750);
    const source = new EventSource(currentActionEventsUrl);
    source.onmessage = () => void refresh();
    source.addEventListener("action.status", () => void refresh());
    source.addEventListener("confirmation.required", () => void refresh());
    source.addEventListener("action.committed", () => void refresh());
    source.addEventListener("action.failed", () => void refresh());
    return () => {
      active = false;
      window.clearInterval(timer);
      source.close();
    };
  }, [continuityId, currentActionEventsUrl, currentActionId, currentActionStatus, readyBranchId]);

  const retry = (): void => {
    setLoadState({ status: "loading" });
    void readWorldState(continuityId).then(setLoadState);
  };

  if (loadState.status === "loading") {
    return (
      <StatusPage
        title="Opening this world…"
        copy="Reading the current Branch head from the authoritative service."
      />
    );
  }
  if (loadState.status === "not-found") {
    return (
      <StatusPage
        title="This Continuity is not available"
        copy="It may not exist or may not be available to this account."
      />
    );
  }
  if (loadState.status === "error") {
    return (
      <StatusPage
        title="The current world could not be read"
        copy="Nothing has been inferred or replaced locally."
      >
        <button className="primary-action" type="button" onClick={retry}>
          Try again
        </button>
      </StatusPage>
    );
  }

  const { data } = loadState;
  const actionResolved =
    !currentAction ||
    ["COMMITTED", "CANCELLED", "SUPERSEDED", "CONFLICT"].includes(currentAction.status);

  const submitAction = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!intent.trim() || !actionResolved) return;
    setMutationError(null);
    const normalizedIntent = intent.trim();
    const existingAttempt = pendingSubmission.current;
    const submission =
      existingAttempt?.intent === normalizedIntent &&
      existingAttempt.expectedHeadCommitId === data.continuity.headCommitId
        ? existingAttempt
        : {
            idempotencyKey: crypto.randomUUID(),
            intent: normalizedIntent,
            expectedHeadCommitId: data.continuity.headCommitId,
          };
    pendingSubmission.current = submission;
    let failureMessage =
      "The acknowledgement could not be confirmed. Retry is safe and uses the same submission.";
    try {
      const response = await fetch(
        `/v1/branches/${encodeURIComponent(data.continuity.branchId)}/actions`,
        {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            schemaVersion: 1,
            idempotencyKey: submission.idempotencyKey,
            expectedHeadCommitId: data.continuity.headCommitId,
            participationExpectation: data.state.participation,
            intent: normalizedIntent,
          }),
        },
      );
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          pendingSubmission.current = null;
          failureMessage = "The Action was not accepted. Review the current world and try again.";
        }
        throw new Error("Action submission did not return an acknowledgement");
      }
      setCurrentAction(actionResponseSchema.parse(await response.json()));
      pendingSubmission.current = null;
      setIntent("");
    } catch {
      setMutationError(failureMessage);
    }
  };

  const confirm = async (): Promise<void> => {
    if (!currentAction?.proposal) return;
    const response = await fetch(`/v1/actions/${encodeURIComponent(currentAction.id)}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        proposalId: currentAction.proposal.id,
        proposalDigest: currentAction.proposal.digest,
        expectedHeadCommitId: currentAction.proposal.expectedHeadCommitId,
      }),
    });
    if (!response.ok) {
      setMutationError(
        "The exact proposal could not be confirmed. Current World truth is unchanged.",
      );
      return;
    }
    const next = actionResponseSchema.parse(await response.json());
    setCurrentAction(next);
    if (next.status === "COMMITTED") {
      const [world, actionHistory] = await Promise.all([
        readWorldState(continuityId),
        readBranchHistory(data.continuity.branchId),
      ]);
      setLoadState(world);
      setHistory(actionHistory);
    }
  };

  const cancel = async (): Promise<void> => {
    if (!currentAction) return;
    const response = await fetch(`/v1/actions/${encodeURIComponent(currentAction.id)}/cancel`, {
      method: "POST",
      headers: { accept: "application/json" },
    });
    if (response.ok) setCurrentAction(actionResponseSchema.parse(await response.json()));
  };

  const retryAction = async (): Promise<void> => {
    if (!currentAction) return;
    const response = await fetch(`/v1/actions/${encodeURIComponent(currentAction.id)}/retry`, {
      method: "POST",
      headers: { accept: "application/json" },
    });
    if (response.ok) setCurrentAction(actionResponseSchema.parse(await response.json()));
  };
  return (
    <div className="world-shell">
      <header className="world-header">
        <Link className="wordmark" to="/" aria-label="Simulora home">
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>Simulora</span>
        </Link>
        <div
          className="source-chip"
          aria-label={`World revision ${data.continuity.worldRevisionNumber}`}
        >
          Revision {data.continuity.worldRevisionNumber} · current path
        </div>
      </header>

      <main className="world-main">
        <section className="world-scene" aria-labelledby="world-title">
          <p className="eyebrow">{data.world.userRole.name}</p>
          <h1 id="world-title">{data.world.title}</h1>
          <p className="world-premise">{data.world.premise}</p>
          <div className="situation-card">
            <p className="card-label">Current situation</p>
            <p>{data.state.openThreads[0] ?? data.world.startingSituation}</p>
          </div>

          <section className="action-zone" aria-labelledby="action-title">
            <div className="action-heading">
              <div>
                <p className="card-label">Participation</p>
                <h2 id="action-title">What do you do?</h2>
              </div>
              <span>{labelMode(data.state.participation.initiativeMode)}</span>
            </div>
            <form onSubmit={(event) => void submitAction(event)}>
              <label htmlFor="world-action">Your Action</label>
              <textarea
                id="world-action"
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                disabled={!actionResolved}
                placeholder="Describe one action in the current world…"
                rows={3}
              />
              <button
                className="primary-action"
                type="submit"
                disabled={!intent.trim() || !actionResolved}
              >
                Send Action
              </button>
            </form>
            {mutationError ? (
              <p className="action-error" role="alert">
                {mutationError}
              </p>
            ) : null}
            {currentAction ? (
              <ActionStatusCard
                action={currentAction}
                onConfirm={confirm}
                onCancel={cancel}
                onRetry={retryAction}
              />
            ) : null}
          </section>

          {history.some((action) => action.status === "COMMITTED") ? (
            <section className="recorded-history" aria-labelledby="recorded-title">
              <p className="card-label">Committed history</p>
              <h2 id="recorded-title">Recorded Actions</h2>
              <ol>
                {history
                  .filter((action) => action.status === "COMMITTED")
                  .map((action) => (
                    <li key={action.id}>
                      <strong>{action.intent}</strong>
                      {action.narrative ? <span>{action.narrative}</span> : null}
                    </li>
                  ))}
              </ol>
            </section>
          ) : null}
        </section>

        <aside className="world-context" aria-label="Current world context">
          <section>
            <h2>What is true now</h2>
            <ul className="truth-list">
              {data.state.facts.map((fact) => {
                const item = fact as { id: string; statement: string };
                return <li key={item.id}>{item.statement}</li>;
              })}
            </ul>
          </section>
          <section>
            <h2>Present here</h2>
            {data.state.characters.map((character) => {
              const item = character as {
                id: string;
                name: string;
                role: string;
                currentState: string;
              };
              return (
                <article className="character-card" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                  <small>{item.currentState}</small>
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
        </aside>
      </main>
    </div>
  );
}

async function readBranchHistory(branchId: string): Promise<BranchActionHistory["actions"]> {
  try {
    const response = await fetch(`/v1/branches/${encodeURIComponent(branchId)}/actions`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return [];
    return branchActionHistorySchema.parse(await response.json()).actions;
  } catch {
    return [];
  }
}

function ActionStatusCard({
  action,
  onConfirm,
  onCancel,
  onRetry,
}: {
  action: ActionResponse;
  onConfirm: () => Promise<void>;
  onCancel: () => Promise<void>;
  onRetry: () => Promise<void>;
}): ReactElement {
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
    CONFLICT: "The world changed before this proposal could be recorded. Nothing was applied.",
    CANCELLED: "Cancelled. Current World truth is unchanged.",
    SUPERSEDED: "This Action was replaced without changing current truth.",
  };
  return (
    <div
      className={`action-status action-status-${action.status.toLowerCase()}`}
      role="status"
      aria-live="polite"
    >
      <p className="card-label">Action status · {action.id.slice(0, 8)}</p>
      <h3>{labelMode(action.status)}</h3>
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
      {action.status === "AWAITING_CONFIRMATION" ? (
        <div className="action-buttons">
          <button className="primary-action" type="button" onClick={() => void onConfirm()}>
            Confirm this exact change
          </button>
          <button className="secondary-action" type="button" onClick={() => void onCancel()}>
            Cancel Action
          </button>
        </div>
      ) : null}
      {["ACKNOWLEDGED", "GENERATING", "VALIDATING"].includes(action.status) ? (
        <button className="secondary-action" type="button" onClick={() => void onCancel()}>
          Cancel Action
        </button>
      ) : null}
      {action.status === "FAILED_RECOVERABLE" ? (
        <div className="action-buttons">
          <button className="primary-action" type="button" onClick={() => void onRetry()}>
            Retry this Action
          </button>
          <button className="secondary-action" type="button" onClick={() => void onCancel()}>
            Cancel Action
          </button>
        </div>
      ) : null}
    </div>
  );
}

function labelMode(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function StatusPage({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children?: ReactElement;
}): ReactElement {
  return (
    <main className="status-page" aria-live="polite">
      <p className="eyebrow">Simulora</p>
      <h1>{title}</h1>
      <p>{copy}</p>
      {children}
      <Link to="/">Return home</Link>
    </main>
  );
}

export function NotFoundPage(): ReactElement {
  return (
    <StatusPage title="Route not found" copy="This production route has not been implemented." />
  );
}
