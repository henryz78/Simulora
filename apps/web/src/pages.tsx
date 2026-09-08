import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  type ActionResponse,
  type AuthoritativeStateResponse,
  type BranchTraceResponse,
  type CorrectionRequest,
  type ExplanationResponse,
  type OrientationResponse,
  type ProjectionFreshness,
  type RecoveryResponse,
  type RestoreProposal,
} from "@simulora/contracts";
import {
  ActionComposer,
  ActionList,
  ActionStatusCard,
  ContinuityLayout,
  StatusPage,
  SurfaceHeader,
  WorldContextSummary,
  labelMode,
  useContinuity,
  readText,
} from "./continuity.js";
import { readBranchTrace, readExplanation, readOrientation } from "./ip4-api.js";
import {
  confirmRestore,
  createRecoveryPoint,
  deleteRecoveryPoint,
  forkBranch,
  prepareRestore,
  readRecovery,
  readRestoreProposal,
  selectBranch,
} from "./ip5-api.js";

export { ContinuityLayout };

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
        <span className="phase-badge">IP-5 · Recovery</span>
      </header>
      <main id="main-content" className="foundation-main">
        <section className="hero" aria-labelledby="foundation-title">
          <p className="eyebrow">Production implementation</p>
          <h1 id="foundation-title">A durable world begins with a known source of truth.</h1>
          <p className="hero-copy">
            Durable Actions, Continuity and non-destructive Recovery now share one authoritative
            Branch/Commit/State Revision spine.
          </p>
        </section>
        <section className="boundary-panel" aria-labelledby="current-boundary">
          <h2 id="current-boundary">Current implementation boundary</h2>
          <ul>
            <li>World and current Continuity state are server-authoritative.</li>
            <li>Existing Continuities remain pinned to their starting World Revision.</li>
            <li>Return and Explanation are derived projections with visible freshness.</li>
            <li>Correction is a direct, exact-confirmation path that preserves history.</li>
            <li>Branch preserves its source; Restore appends instead of rewinding history.</li>
          </ul>
        </section>
      </main>
      <footer className="site-footer">Product Implementation · IP-5 Recovery</footer>
    </div>
  );
}

export function WorldPage(): ReactElement {
  const {
    loadState,
    history,
    actions,
    pendingActionRefs,
    confirmAction,
    cancelAction,
    retryAction,
  } = useContinuity();
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
  if (loadState.status === "error") return <WorldReadError />;

  const { data } = loadState;
  const latestAction = [...history]
    .reverse()
    .map((entry) => actions.get(entry.id))
    .find((action): action is ActionResponse => Boolean(action));
  const committedHistory = history.filter((entry) => entry.status === "COMMITTED");
  return (
    <div className="world-shell">
      <div className="world-main">
        <section className="world-scene" aria-labelledby="world-title">
          <p className="eyebrow">{data.world.userRole.name}</p>
          <h1 id="world-title">{data.world.title}</h1>
          <p className="world-premise">{data.world.premise}</p>
          <p className="starting-background">Starting background: {data.world.startingSituation}</p>
          <div className="situation-card">
            <p className="card-label">Current situation</p>
            <p>{currentSituation(data)}</p>
          </div>

          <ActionComposer />
          {pendingActionRefs.length > 0 ? (
            <section className="pending-actions-panel" aria-labelledby="pending-actions-title">
              <p className="card-label">Resolve before continuing</p>
              <h2 id="pending-actions-title">Pending Actions</h2>
              <ActionList />
            </section>
          ) : latestAction ? (
            <section className="latest-action-panel" aria-labelledby="latest-action-title">
              <p className="card-label">Latest outcome</p>
              <h2 id="latest-action-title">The current path is ready for your next choice</h2>
              <ActionStatusCard
                action={latestAction}
                onConfirm={confirmAction}
                onCancel={cancelAction}
                onRetry={retryAction}
              />
            </section>
          ) : null}

          {committedHistory.length > 0 ? (
            <section className="recorded-history" aria-labelledby="recorded-title">
              <p className="card-label">Committed history</p>
              <h2 id="recorded-title">Recorded Actions</h2>
              <ol>
                {committedHistory.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.intent}</strong>
                    <span>Historical record · retained for context and explanation.</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </section>

        <WorldContextSummary />
      </div>
    </div>
  );
}

function WorldReadError(): ReactElement {
  const { refresh } = useContinuity();
  return (
    <StatusPage
      title="The current world could not be read"
      copy="Nothing has been inferred or replaced locally. The authoritative state remains the recovery source."
    >
      <button className="primary-action" type="button" onClick={() => void refresh()}>
        Try again
      </button>
    </StatusPage>
  );
}

export function ReturnPage(): ReactElement {
  const { loadState, continuityId, pendingActionRefs } = useContinuity();
  const [projection, setProjection] = useState<OrientationResponse | null>(null);
  const [projectionState, setProjectionState] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const requestHead = loadState.status === "ready" ? loadState.data.continuity.headCommitId : null;

  useEffect(() => {
    if (loadState.status !== "ready") return;
    let active = true;
    const expectedHead = loadState.data.continuity.headCommitId;
    void readOrientation(continuityId).then((result) => {
      if (!active) return;
      if (
        result.data &&
        result.data.freshness.currentHeadCommitId === expectedHead &&
        result.data.projectionUpdatedAt !== null
      ) {
        setProjection(result.data);
        setProjectionState("ready");
      } else {
        setProjection(null);
        setProjectionState("fallback");
      }
    });
    return () => {
      active = false;
    };
  }, [continuityId, loadState]);

  if (loadState.status !== "ready") {
    return <StatusPage title="Preparing your return…" copy="The current path is being read." />;
  }
  const { data } = loadState;
  const usingAuthoritativeFallback = projectionState === "fallback";
  const orientation = projection ?? fallbackOrientation(data, continuityId);
  const freshness = orientation.freshness;
  const recentChangesUnavailable =
    usingAuthoritativeFallback ||
    (freshness.status !== "FRESH" && orientation.recentChanges.length === 0);
  return (
    <div className="surface-page orientation-page">
      <SurfaceHeader
        eyebrow="Return orientation"
        title={`Welcome back to ${data.world.title}`}
        copy="A short briefing from committed sources so you can continue without rebuilding the path by hand."
      >
        <span
          className={`freshness-pill ${usingAuthoritativeFallback ? "freshness-fallback" : `freshness-${freshness.status.toLowerCase()}`}`}
        >
          {usingAuthoritativeFallback
            ? "Authoritative state · projection unavailable"
            : freshnessLabel(freshness)}
        </span>
      </SurfaceHeader>
      {pendingActionRefs.length > 0 ? (
        <PendingOrientationNotice
          continuityId={continuityId}
          pendingActionRefs={pendingActionRefs}
        />
      ) : null}
      <div className="surface-grid orientation-grid">
        <div>
          <section className="surface-card" aria-labelledby="orientation-now">
            <p className="card-label">Now</p>
            <h2 id="orientation-now">What is happening</h2>
            <p className="orientation-lead">{orientation.current.situation}</p>
            <p className="muted-copy">
              World clock: {orientation.current.worldClock.label} · turn{" "}
              {orientation.current.worldClock.turn}
            </p>
          </section>
          <section className="surface-card" aria-labelledby="orientation-changes">
            <p className="card-label">Committed sources only</p>
            <h2 id="orientation-changes">Recent recorded changes</h2>
            {recentChangesUnavailable ? (
              <p className="empty-state">
                Recent recorded changes are unavailable while this derived view rebuilds. No
                client-side change record is being inferred.
              </p>
            ) : orientation.recentChanges.length > 0 ? (
              <ul className="change-list">
                {orientation.recentChanges.map((change, index) => (
                  <li key={`${change.commitId}:${change.targetId ?? "change"}:${index}`}>
                    <strong>{change.summary}</strong>
                    <span>
                      {labelMode(change.sourceClass)} source · {labelMode(change.eventType)} ·{" "}
                      {change.scope}
                    </span>
                    <small>Commit {shortId(change.commitId)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                There is no recent meaningful change recorded on this path.
              </p>
            )}
            <p className="muted-copy">
              This is a bounded recent-history view, not a personal last-seen ledger.
            </p>
          </section>
        </div>
        <div>
          <section className="surface-card" aria-labelledby="orientation-matters">
            <p className="card-label">Still matters</p>
            <h2 id="orientation-matters">Open threads and relationships</h2>
            {orientation.openThreads.length > 0 ? (
              <ul className="plain-list">
                {orientation.openThreads.map((thread) => (
                  <li key={thread}>{thread}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No open thread is currently recorded.</p>
            )}
            {orientation.relationships.length > 0 ? (
              <ul className="plain-list relationship-list">
                {orientation.relationships.map((relationship) => (
                  <li key={relationship.id}>{relationship.description}</li>
                ))}
              </ul>
            ) : null}
          </section>
          <section
            className="surface-card continuation-card"
            aria-labelledby="orientation-continue"
          >
            <p className="card-label">Continue</p>
            <h2 id="orientation-continue">Choose your next participation point</h2>
            <p>{orientation.nextParticipation.label}</p>
            <Link
              className="primary-action inline-action"
              to={`/continuities/${encodeURIComponent(continuityId)}`}
            >
              Continue in world
            </Link>
            <Link
              className="secondary-action inline-action"
              to={`/continuities/${encodeURIComponent(continuityId)}/continuity`}
            >
              Understand current continuity
            </Link>
          </section>
        </div>
      </div>
      <section className="freshness-panel" aria-labelledby="orientation-freshness">
        <h2 id="orientation-freshness">Projection freshness</h2>
        <p>
          {projectionState === "ready"
            ? "This briefing is a derived orientation over committed sources."
            : "The derived orientation is unavailable or behind the current head. This view is a conservative reading of authoritative current state; recent change history is not inferred."}
        </p>
        <dl className="metadata-list">
          <div>
            <dt>Projection source head</dt>
            <dd>
              {usingAuthoritativeFallback ? "Unavailable" : shortId(freshness.sourceHeadCommitId)}
            </dd>
          </div>
          <div>
            <dt>Current Branch head</dt>
            <dd>{shortId(data.continuity.headCommitId)}</dd>
          </div>
          <div>
            <dt>Head distance</dt>
            <dd>{usingAuthoritativeFallback ? "Unavailable" : freshness.headDistance}</dd>
          </div>
        </dl>
        {freshness.status !== "FRESH" ? (
          <Link
            className="secondary-action inline-action"
            to={`/continuities/${encodeURIComponent(continuityId)}`}
          >
            Read authoritative current state
          </Link>
        ) : null}
      </section>
      {requestHead && requestHead !== freshness.currentHeadCommitId ? (
        <p className="action-error" role="alert">
          This briefing no longer matches the current Branch head. Read the current state before
          acting.
        </p>
      ) : null}
    </div>
  );
}

function PendingOrientationNotice({
  continuityId,
  pendingActionRefs,
}: {
  continuityId: string;
  pendingActionRefs: Array<{ id: string; intent: string }>;
}): ReactElement {
  return (
    <section className="pending-orientation" aria-labelledby="pending-orientation-title">
      <div>
        <p className="card-label">Attention before continuing</p>
        <h2 id="pending-orientation-title">An unresolved Action remains part of this path</h2>
        <p>
          It has not been folded into current truth. Review its durable status before sending
          another ordinary Action.
        </p>
      </div>
      <div className="pending-orientation-links">
        {pendingActionRefs.map((entry) => (
          <Link
            key={entry.id}
            to={`/continuities/${encodeURIComponent(continuityId)}/actions/${encodeURIComponent(entry.id)}`}
          >
            Review {shortId(entry.id)} · {entry.intent}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ContinuityPage(): ReactElement {
  const { loadState, history, actions } = useContinuity();
  if (loadState.status !== "ready") {
    return <StatusPage title="Opening Continuity…" copy="Reading the current Branch head." />;
  }
  const { data } = loadState;
  const currentFacts = data.state.facts
    .filter((value) => isCurrentFactValue(value))
    .map((fact) => currentFact(fact))
    .filter((fact): fact is CurrentFact => Boolean(fact));
  const committed = history.filter((entry) => entry.status === "COMMITTED");
  return (
    <div className="surface-page continuity-page">
      <SurfaceHeader
        eyebrow="Current path"
        title="Continuity"
        copy="Start with what currently holds on this path, then choose the specific fact or change you want to understand."
      />
      <section
        className="surface-card current-path-card"
        aria-labelledby="continuity-current-title"
      >
        <div>
          <p className="card-label">Current state</p>
          <h2 id="continuity-current-title">What currently holds</h2>
          <p>{currentSituation(data)}</p>
        </div>
        <dl className="metadata-list">
          <div>
            <dt>World revision</dt>
            <dd>{data.continuity.worldRevisionNumber}</dd>
          </div>
          <div>
            <dt>Current head</dt>
            <dd>{shortId(data.continuity.headCommitId)}</dd>
          </div>
          <div>
            <dt>Clock</dt>
            <dd>{data.state.worldClock.label}</dd>
          </div>
        </dl>
      </section>
      <div className="surface-grid continuity-grid">
        <section className="surface-card" aria-labelledby="continuity-facts-title">
          <p className="card-label">Choose a fact</p>
          <h2 id="continuity-facts-title">Facts that are accessible here</h2>
          {currentFacts.length > 0 ? (
            <ul className="fact-links">
              {currentFacts.map((fact) => (
                <li key={fact.id}>
                  <Link
                    to={`/continuities/${encodeURIComponent(data.continuity.id)}/continuity/facts/${encodeURIComponent(fact.id)}`}
                  >
                    <strong>{fact.statement}</strong>
                    <span>
                      {fact.scope} · {labelMode(fact.lifecycle ?? "ACTIVE")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No current fact is available in this scope.</p>
          )}
        </section>
        <section className="surface-card" aria-labelledby="continuity-changes-title">
          <p className="card-label">Committed history</p>
          <h2 id="continuity-changes-title">Meaningful changes</h2>
          {committed.length > 0 ? (
            <ul className="change-links">
              {committed
                .slice(-8)
                .reverse()
                .map((entry) => {
                  const action = actions.get(entry.id);
                  const commitId = action?.commit?.id;
                  return (
                    <li key={entry.id}>
                      {commitId ? (
                        <Link
                          to={`/continuities/${encodeURIComponent(data.continuity.id)}/context?commit=${encodeURIComponent(commitId)}`}
                        >
                          <strong>{entry.intent}</strong>
                          <span>View Change Trace · Commit {shortId(commitId)}</span>
                        </Link>
                      ) : (
                        <span>
                          <strong>{entry.intent}</strong>
                          <small>Historical record retained.</small>
                        </span>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="empty-state">There is no committed change to explain yet.</p>
          )}
        </section>
      </div>
      <section className="surface-card boundary-card" aria-labelledby="continuity-boundary-title">
        <h2 id="continuity-boundary-title">Explanation boundary</h2>
        <p>
          Explanations name only the permitted source class, Commit, scope and freshness. Hidden
          prompts, provider reasoning and inaccessible source identities are never shown here.
        </p>
        <Link
          className="secondary-action inline-action"
          to={`/continuities/${encodeURIComponent(data.continuity.id)}/context`}
        >
          Open Change Trace and pending work
        </Link>
      </section>
    </div>
  );
}

export function FactLensPage(): ReactElement {
  const { factId } = useParams<{ factId: string }>();
  const { loadState, continuityId } = useContinuity();
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const branchId = loadState.status === "ready" ? loadState.data.continuity.branchId : null;
  const head = loadState.status === "ready" ? loadState.data.continuity.headCommitId : null;

  useEffect(() => {
    if (!factId || !branchId || !head) return;
    let active = true;
    const expectedHead = head;
    void readExplanation(branchId, "fact", factId).then((result) => {
      if (!active) return;
      if (result.data && result.data.freshness.currentHeadCommitId === expectedHead) {
        setExplanation(result.data);
        setState("ready");
      } else {
        setExplanation(null);
        setState("unavailable");
      }
    });
    return () => {
      active = false;
    };
  }, [branchId, factId, head]);

  if (loadState.status !== "ready") {
    return <StatusPage title="Opening this fact…" copy="Reading the current authorized state." />;
  }
  const fact = factId
    ? (loadState.data.state.facts
        .filter((value) => isCurrentFactValue(value))
        .map((item) => currentFact(item))
        .find((item) => item?.id === factId) ?? null)
    : null;
  if (!fact && !explanation) {
    return (
      <StatusPage
        title="This explanation is not available"
        copy={
          state === "unavailable"
            ? "The explanation projection is temporarily unavailable or outside this account's permitted scope. No hidden source was inferred."
            : "The selected fact is not present in the current authorized state."
        }
      >
        <Link className="secondary-action inline-action" to="..">
          Back to Continuity
        </Link>
      </StatusPage>
    );
  }
  const targetStatement =
    explanation?.target.statement ?? fact?.statement ?? "Selected continuity item";
  const current = explanation?.target.current ?? Boolean(fact);
  return (
    <div className="surface-page lens-page">
      <SurfaceHeader
        eyebrow="Contextual explanation"
        title="Why this is active"
        copy="A scoped explanation of one accessible continuity item."
      />
      <section className="surface-card lens-target" aria-labelledby="lens-target-title">
        <p className="card-label">Item</p>
        <h2 id="lens-target-title">{targetStatement}</h2>
        <p className="state-label">
          {current ? "Current canonical state" : "Historical state · not current"}
        </p>
        {explanation ? (
          <p>{explanation.explanation}</p>
        ) : (
          <p>Current state is readable, but its detailed explanation is temporarily unavailable.</p>
        )}
      </section>
      {explanation ? (
        <>
          <section className="surface-card" aria-labelledby="lens-source-title">
            <p className="card-label">Permitted provenance</p>
            <h2 id="lens-source-title">Why it is available here</h2>
            <dl className="metadata-list">
              <div>
                <dt>Source class</dt>
                <dd>{labelMode(explanation.source.class)}</dd>
              </div>
              <div>
                <dt>Commit reference</dt>
                <dd>{shortId(explanation.source.commitId)}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd>{explanation.scope}</dd>
              </div>
              <div>
                <dt>Freshness</dt>
                <dd>{freshnessLabel(explanation.freshness)}</dd>
              </div>
            </dl>
          </section>
          <section className="surface-card correction-path" aria-labelledby="lens-correction-title">
            <p className="card-label">What you can do</p>
            <h2 id="lens-correction-title">Review a correction path</h2>
            {current && explanation.correction.availableOperations.length > 0 ? (
              <div className="action-buttons">
                {explanation.correction.availableOperations.includes("CORRECT_CONTINUITY") ? (
                  <Link
                    className="primary-action inline-action"
                    to={`/continuities/${encodeURIComponent(continuityId)}/correction/${encodeURIComponent(factId ?? explanation.target.id)}?operation=CORRECT_CONTINUITY`}
                  >
                    Correct this fact
                  </Link>
                ) : null}
                {explanation.correction.availableOperations.includes("REMOVE_CONTINUITY") ? (
                  <Link
                    className="secondary-action inline-action"
                    to={`/continuities/${encodeURIComponent(continuityId)}/correction/${encodeURIComponent(factId ?? explanation.target.id)}?operation=REMOVE_CONTINUITY`}
                  >
                    Request removal
                  </Link>
                ) : null}
              </div>
            ) : (
              <p className="empty-state">
                No direct correction operation is available for this item.
              </p>
            )}
            <p className="muted-copy">
              Any correction is a direct review with exact before/after, scope, reason and
              current-head confirmation. Cancel or conflict leaves current truth untouched.
            </p>
          </section>
        </>
      ) : null}
      <section className="privacy-boundary" aria-label="Explanation safety boundary">
        Some context is not shown because it is outside your permitted scope. This surface never
        reveals raw prompts, provider reasoning or hidden source identities.
      </section>
    </div>
  );
}

export function ContextPage(): ReactElement {
  const { loadState, continuityId } = useContinuity();
  const [trace, setTrace] = useState<BranchTraceResponse | null>(null);
  const [traceState, setTraceState] = useState<"loading" | "ready" | "unavailable">("loading");
  const branchId = loadState.status === "ready" ? loadState.data.continuity.branchId : null;
  const head = loadState.status === "ready" ? loadState.data.continuity.headCommitId : null;
  useEffect(() => {
    if (!branchId || !head) return;
    let active = true;
    const expectedHead = head;
    void readBranchTrace(branchId).then((result) => {
      if (!active) return;
      if (result.data && result.data.freshness.currentHeadCommitId === expectedHead) {
        setTrace(result.data);
        setTraceState("ready");
      } else {
        setTrace(null);
        setTraceState("unavailable");
      }
    });
    return () => {
      active = false;
    };
  }, [branchId, head]);

  if (loadState.status !== "ready") {
    return (
      <StatusPage title="Opening context…" copy="Reading current truth and its permitted trace." />
    );
  }
  return (
    <div className="surface-page context-page">
      <SurfaceHeader
        eyebrow="World Context"
        title="Current state and Change Trace"
        copy="Inspect current truth, pending work and committed causal history without turning this surface into another owner."
      />
      <div className="context-layout">
        <WorldContextSummary />
        <div>
          <section className="surface-card context-pending" aria-labelledby="context-pending-title">
            <p className="card-label">Durable Action status</p>
            <h2 id="context-pending-title">Pending work</h2>
            <ActionList compact />
          </section>
          <section className="surface-card trace-card" aria-labelledby="trace-title">
            <p className="card-label">Committed provenance</p>
            <h2 id="trace-title">Change Trace</h2>
            {trace ? (
              <>
                <div className="trace-freshness">
                  {freshnessLabel(trace.freshness)} · source head{" "}
                  {shortId(trace.freshness.sourceHeadCommitId)}
                </div>
                <ol className="trace-list">
                  {trace.commits.map((commit) => (
                    <li key={commit.id}>
                      <div className="trace-heading">
                        <strong>{labelMode(commit.kind)}</strong>
                        <span>
                          {labelMode(commit.sourceClass)} · {shortId(commit.id)}
                        </span>
                      </div>
                      {commit.reason ? <p>{commit.reason}</p> : null}
                      {commit.events.length > 0 ? (
                        <ul>
                          {commit.events.map((event) => (
                            <li key={event.id}>
                              <span>{event.summary}</span>
                              <small>
                                {labelMode(event.type)} · {event.scope}
                              </small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-copy">
                          No additional event detail is available in this scope.
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="empty-state">
                {traceState === "unavailable"
                  ? "Change Trace is temporarily unavailable or rebuilding. Current authoritative state remains readable."
                  : "No committed Change Trace is available yet."}
              </p>
            )}
          </section>
        </div>
      </div>
      <Link
        className="secondary-action inline-action"
        to={`/continuities/${encodeURIComponent(continuityId)}`}
      >
        Return to world
      </Link>
    </div>
  );
}

type RecoveryCommitSource = {
  id: string;
  branchId: string;
  branchName: string;
  kind: string;
  createdAt: string;
};

async function readRecoveryCommitSources(next: RecoveryResponse): Promise<RecoveryCommitSource[]> {
  const traces = await Promise.all(
    next.branches.map(async (branch) => {
      const commits: RecoveryCommitSource[] = [];
      let cursor: string | undefined;
      const seen = new Set<string>();
      do {
        const result = await readBranchTrace(branch.id, cursor);
        if (!result.data) break;
        commits.push(
          ...result.data.commits.map((commit) => ({
            id: commit.id,
            branchId: branch.id,
            branchName: branch.name,
            kind: commit.kind,
            createdAt: commit.createdAt,
          })),
        );
        const nextCursor = result.data.nextCursor ?? undefined;
        if (!nextCursor || seen.has(nextCursor)) break;
        seen.add(nextCursor);
        cursor = nextCursor;
      } while (cursor);
      return commits;
    }),
  );
  return [...new Map(traces.flat().map((commit) => [commit.id, commit])).values()].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  );
}

export function RecoveryPage(): ReactElement {
  const { continuityId, loadState, pendingActionRefs, refresh } = useContinuity();
  const [recovery, setRecovery] = useState<RecoveryResponse | null>(null);
  const [restore, setRestore] = useState<RestoreProposal | null>(null);
  const [label, setLabel] = useState("Before the next choice");
  const [branchName, setBranchName] = useState("Alternative path");
  const [branchSourceCommitId, setBranchSourceCommitId] = useState("");
  const [restoreSourceCommitId, setRestoreSourceCommitId] = useState("");
  const [commitSources, setCommitSources] = useState<RecoveryCommitSource[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pointKey = useRef<string | null>(null);
  const branchKey = useRef<string | null>(null);
  const head = loadState.status === "ready" ? loadState.data.continuity.headCommitId : null;
  const branchId = loadState.status === "ready" ? loadState.data.continuity.branchId : null;

  const reload = async (): Promise<void> => {
    const result = await readRecovery(continuityId);
    if (result.data) {
      const next = result.data;
      setRecovery(next);
      setRestore(next.restoreProposals[0] ?? null);
      setBranchSourceCommitId((current) => current || head || "");
      setRestoreSourceCommitId(
        (current) => current || next.recoveryPoints[0]?.commitId || head || "",
      );
      setCommitSources(await readRecoveryCommitSources(next));
      setMessage(null);
    } else {
      setMessage("Recovery state is unavailable. Current World truth was not changed.");
    }
  };

  useEffect(() => {
    if (!head) return;
    let active = true;
    void readRecovery(continuityId).then(async (result) => {
      if (!active) return;
      if (result.data) {
        setRecovery(result.data);
        setRestore(result.data.restoreProposals[0] ?? null);
        setBranchSourceCommitId(head);
        setRestoreSourceCommitId(result.data.recoveryPoints[0]?.commitId ?? head);
        const sources = await readRecoveryCommitSources(result.data);
        if (active) setCommitSources(sources);
      } else {
        setMessage("Recovery state is unavailable. Current World truth was not changed.");
      }
    });
    return () => {
      active = false;
    };
  }, [continuityId, head]);

  if (loadState.status !== "ready" || !branchId || !head) {
    return (
      <StatusPage
        title="Opening Recovery…"
        copy="Reading the current Branch and its safe references."
      />
    );
  }

  const pointLabels = new Map(
    (recovery?.recoveryPoints ?? []).map((point) => [point.commitId, point.label]),
  );
  const run = async (name: string, work: () => Promise<void>): Promise<void> => {
    if (busy) return;
    setBusy(name);
    setMessage(null);
    try {
      await work();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="surface-page recovery-page">
      <SurfaceHeader
        eyebrow="Recovery"
        title="Preserve, branch or restore this path"
        copy="Recovery operates on the current Continuity. It does not erase history, repair a single fact, or change a future World Revision."
      />
      {pendingActionRefs.length > 0 ? (
        <section className="surface-card recovery-pending" aria-labelledby="recovery-pending-title">
          <p className="card-label">Pending Action preserved</p>
          <h2 id="recovery-pending-title">Finish the unresolved Action before switching paths</h2>
          <p>
            Recovery inspection did not clear it. Use the Action ribbon above to confirm, cancel or
            retry it.
          </p>
        </section>
      ) : null}
      <div className="recovery-grid">
        <section className="surface-card" aria-labelledby="safe-point-title">
          <p className="card-label">Safe Point</p>
          <h2 id="safe-point-title">Name the current Commit</h2>
          <p>This creates a reference only. No World state is copied.</p>
          <label className="field-label" htmlFor="safe-point-label">
            Label
            <input
              id="safe-point-label"
              value={label}
              maxLength={160}
              onChange={(event) => {
                setLabel(event.target.value);
                pointKey.current = null;
              }}
            />
          </label>
          <button
            className="primary-action"
            type="button"
            disabled={busy !== null || !label.trim()}
            onClick={() =>
              void run("point", async () => {
                pointKey.current ??= crypto.randomUUID();
                const result = await createRecoveryPoint(branchId, {
                  idempotencyKey: pointKey.current,
                  label: label.trim(),
                  commitId: head,
                });
                if (!result.data) {
                  setMessage(
                    "The Safe Point was not confirmed. Retry is safe; current truth is unchanged.",
                  );
                  return;
                }
                pointKey.current = null;
                setBranchSourceCommitId(result.data.commitId);
                await reload();
                setMessage("Safe Point recorded as a reference to the current Commit.");
              })
            }
          >
            {busy === "point" ? "Recording…" : "Create Safe Point"}
          </button>
          {recovery?.recoveryPoints.length ? (
            <ul className="recovery-list">
              {recovery.recoveryPoints.map((point) => (
                <li key={point.id}>
                  <span>
                    <strong>{point.label}</strong>
                    <small>{shortId(point.commitId)}</small>
                  </span>
                  <button
                    className="text-action"
                    type="button"
                    onClick={() =>
                      void run("delete-point", async () => {
                        if (
                          !window.confirm(
                            "Delete this label only? The referenced Commit and history remain.",
                          )
                        )
                          return;
                        const result = await deleteRecoveryPoint(point.id);
                        if (!result.data) {
                          setMessage("The label could not be deleted. No World state changed.");
                          return;
                        }
                        await reload();
                        setMessage("Safe Point label deleted. Its Commit and history remain.");
                      })
                    }
                  >
                    Delete label only
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No Safe Point labels yet.</p>
          )}
        </section>

        <section className="surface-card" aria-labelledby="branch-title">
          <p className="card-label">Branch</p>
          <h2 id="branch-title">Create a separate experiment</h2>
          <p>The original path, head and history remain unchanged. V1 does not merge Branches.</p>
          <label className="field-label" htmlFor="branch-name">
            Branch name
            <input
              id="branch-name"
              value={branchName}
              maxLength={160}
              onChange={(event) => {
                setBranchName(event.target.value);
                branchKey.current = null;
              }}
            />
          </label>
          <label className="field-label" htmlFor="branch-source">
            Start from
            <select
              id="branch-source"
              value={branchSourceCommitId || head}
              onChange={(event) => setBranchSourceCommitId(event.target.value)}
            >
              <option value={head}>Current head · {shortId(head)}</option>
              {commitSources
                .filter((commit) => commit.id !== head)
                .map((commit) => (
                  <option key={commit.id} value={commit.id}>
                    {pointLabels.get(commit.id) ?? labelMode(commit.kind)} · {commit.branchName} ·{" "}
                    {shortId(commit.id)}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="primary-action"
            type="button"
            disabled={busy !== null || !branchName.trim()}
            onClick={() =>
              void run("branch", async () => {
                branchKey.current ??= crypto.randomUUID();
                const result = await forkBranch(continuityId, {
                  idempotencyKey: branchKey.current,
                  name: branchName.trim(),
                  sourceCommitId: branchSourceCommitId || head,
                  expectedHeadCommitId: head,
                });
                if (!result.data) {
                  setMessage("The Branch was not created. The source path remains unchanged.");
                  return;
                }
                branchKey.current = null;
                await reload();
                setMessage(
                  "Separate Branch created. The original remains the current path until you switch.",
                );
              })
            }
          >
            {busy === "branch" ? "Creating…" : "Create separate Branch"}
          </button>
          <ul className="recovery-list branch-list">
            {recovery?.branches.map((branch) => (
              <li key={branch.id}>
                <span>
                  <strong>{branch.name}</strong>
                  <small>
                    {branch.isCurrent ? "Current path" : `Head ${shortId(branch.headCommitId)}`}
                  </small>
                </span>
                {!branch.isCurrent ? (
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={busy !== null || pendingActionRefs.length > 0}
                    onClick={() =>
                      void run("select", async () => {
                        const result = await selectBranch(continuityId, branch.id);
                        if (!result.data) {
                          setMessage(
                            result.errorCode === "PENDING_ACTIONS_REQUIRE_RESOLUTION"
                              ? "Resolve the pending Action before switching the current path."
                              : "The current path was not changed.",
                          );
                          return;
                        }
                        setRecovery(result.data);
                        setRestore(null);
                        await refresh();
                        setMessage(
                          "Current path changed. The previous Branch remains available and unchanged.",
                        );
                      })
                    }
                  >
                    Make current path
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card restore-card" aria-labelledby="restore-title">
          <p className="card-label">Restore</p>
          <h2 id="restore-title">Append an earlier world state</h2>
          <p>Restore creates a new Commit on the current Branch. Later history is retained.</p>
          <label className="field-label" htmlFor="restore-source">
            Restore from
            <select
              id="restore-source"
              value={restoreSourceCommitId || head}
              onChange={(event) => {
                setRestoreSourceCommitId(event.target.value);
                setRestore(null);
              }}
            >
              <option value={head}>Current head · no earlier change</option>
              {commitSources
                .filter((commit) => commit.id !== head)
                .map((commit) => (
                  <option key={commit.id} value={commit.id}>
                    {pointLabels.get(commit.id) ?? labelMode(commit.kind)} · {commit.branchName} ·{" "}
                    {shortId(commit.id)}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="secondary-action"
            type="button"
            disabled={busy !== null || (restoreSourceCommitId || head) === head}
            onClick={() =>
              void run("review", async () => {
                const result = await prepareRestore(branchId, restoreSourceCommitId);
                if (!result.data) {
                  setRestore(null);
                  setMessage("A Restore review could not be prepared. Current truth is unchanged.");
                  return;
                }
                setRestore(result.data);
              })
            }
          >
            {busy === "review" ? "Comparing…" : "Review Restore scope"}
          </button>
          {restore ? (
            <div className="restore-review" role="region" aria-label="Exact Restore review">
              <h3>Exact Restore review</h3>
              <p>
                <strong>Would change:</strong> {restore.changedSections.join(", ")}
              </p>
              <div className="restore-section-diffs">
                {restore.sectionChanges.map((change) => (
                  <details key={change.section}>
                    <summary>{change.section} · exact before / after</summary>
                    <div className="restore-section-diff">
                      <div>
                        <strong>Current</strong>
                        <pre>{JSON.stringify(change.before, null, 2)}</pre>
                      </div>
                      <div>
                        <strong>From selected Commit</strong>
                        <pre>{JSON.stringify(change.after, null, 2)}</pre>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
              <p>
                <strong>Included:</strong> {restore.includedSections.join(", ")}
              </p>
              <p>
                <strong>Excluded and preserved:</strong> {restore.excludedSections.join(", ")}
              </p>
              <p className="muted-copy">
                Expected current head: {shortId(restore.expectedHeadCommitId)} · review expires{" "}
                {new Date(restore.expiresAt).toLocaleTimeString()}
              </p>
              <button
                className="primary-action"
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void run("restore", async () => {
                    const result = await confirmRestore(branchId, restore);
                    if (!result.data) {
                      if (result.errorCode === "RESTORE_REVIEW_STALE") {
                        setRestore(null);
                        setMessage(
                          "The current path or Branch head changed after review. Nothing was restored; prepare a new review.",
                        );
                        return;
                      }
                      if (
                        result.errorCode === "RESTORE_CONFIRMATION_MISMATCH" ||
                        result.errorCode === "RESTORE_REVIEW_NOT_ACTIVE"
                      ) {
                        setRestore(null);
                        setMessage(
                          "Restore was rejected before mutation. Current truth is unchanged.",
                        );
                        return;
                      }
                      const recovered = await readRestoreProposal(restore.id);
                      if (recovered.data?.status === "CONFIRMED" && recovered.data.resultCommitId) {
                        setRestore(null);
                        await refresh();
                        await reload();
                        setMessage(
                          "Restore was recorded as a new Commit. The interrupted response was recovered from its durable result.",
                        );
                        return;
                      }
                      if (recovered.data?.status === "STALE") {
                        setRestore(null);
                        setMessage(
                          "The Restore review became stale. Nothing was restored; prepare a new review.",
                        );
                        return;
                      }
                      if (recovered.data?.status === "ACTIVE") {
                        setRestore(recovered.data);
                        setMessage(
                          "The confirmation response was interrupted. The exact review is still active; retrying confirmation is safe.",
                        );
                        return;
                      }
                      setRestore(restore);
                      setMessage(
                        "The confirmation outcome could not be verified. Do not assume the World changed; retry recovery status before acting again.",
                      );
                      return;
                    }
                    setRestore(null);
                    await refresh();
                    await reload();
                    setMessage(
                      "Restore recorded as a new Commit. Earlier and intervening history remain.",
                    );
                  })
                }
              >
                {busy === "restore" ? "Recording…" : "Confirm exact Restore"}
              </button>
            </div>
          ) : null}
        </section>

        <section
          className="surface-card recovery-boundaries"
          aria-labelledby="recovery-boundaries-title"
        >
          <p className="card-label">Different operations</p>
          <h2 id="recovery-boundaries-title">Correction and Delete are not Restore</h2>
          <ul>
            <li>
              <strong>Correction</strong> repairs one current canonical record through its own exact
              review.
            </li>
            <li>
              <strong>Delete</strong> is a separate lifecycle boundary with retention consequences;
              it is not an undo control and is not performed here.
            </li>
          </ul>
          <Link
            className="secondary-action inline-action"
            to={`/continuities/${encodeURIComponent(continuityId)}/continuity`}
          >
            Inspect or correct Continuity
          </Link>
        </section>
      </div>
      {message ? (
        <p className="recovery-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function ActionStatusPage(): ReactElement {
  const { actionId } = useParams<{ actionId: string }>();
  const { actions, readAction, confirmAction, cancelAction, retryAction, continuityId } =
    useContinuity();
  const [loadedAction, setLoadedAction] = useState<ActionResponse | null>(
    actionId ? (actions.get(actionId) ?? null) : null,
  );
  const [state, setState] = useState<"loading" | "ready" | "not-found">(
    loadedAction ? "ready" : "loading",
  );
  useEffect(() => {
    if (!actionId) {
      return;
    }
    let active = true;
    void readAction(actionId).then((next) => {
      if (!active) return;
      if (next) {
        setLoadedAction(next);
        setState("ready");
      } else {
        setState("not-found");
      }
    });
    return () => {
      active = false;
    };
  }, [actionId, readAction]);
  const action = actionId ? (actions.get(actionId) ?? loadedAction) : loadedAction;
  if (state === "loading") {
    return (
      <StatusPage title="Recovering Action status…" copy="Reading the durable Action resource." />
    );
  }
  if (state === "not-found" || !action) {
    return (
      <StatusPage
        title="This Action is not available"
        copy="It may be outside this Continuity or unavailable to this account."
      />
    );
  }
  return (
    <div className="surface-page action-page">
      <SurfaceHeader
        eyebrow={labelMode(action.operationType)}
        title="Action status"
        copy="This status is durable and remains available while supporting surfaces change."
      />
      <ActionStatusCard
        action={action}
        onConfirm={confirmAction}
        onCancel={cancelAction}
        onRetry={retryAction}
      />
      {action.operationType !== "PARTICIPATE" ? (
        <section className="surface-card action-boundary" aria-labelledby="action-boundary-title">
          <h2 id="action-boundary-title">Protected correction boundary</h2>
          <p>
            This is a direct continuity operation. It cannot be reclassified as an ordinary
            participation Action, and a stale head requires a fresh review.
          </p>
        </section>
      ) : null}
      <Link
        className="secondary-action inline-action"
        to={`/continuities/${encodeURIComponent(continuityId)}`}
      >
        Return to world
      </Link>
    </div>
  );
}

export function CorrectionReviewPage(): ReactElement {
  const { targetId } = useParams<{ targetId: string }>();
  const [searchParams] = useSearchParams();
  const { loadState, continuityId, refresh, submitCorrection } = useContinuity();
  const initialOperation =
    searchParams.get("operation") === "REMOVE_CONTINUITY"
      ? "REMOVE_CONTINUITY"
      : "CORRECT_CONTINUITY";
  const [operation, setOperation] = useState<"CORRECT_CONTINUITY" | "REMOVE_CONTINUITY">(
    initialOperation,
  );
  const [after, setAfter] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();
  const idempotencyKey = useRef<string | null>(null);

  if (loadState.status !== "ready") {
    return (
      <StatusPage
        title="Preparing correction review…"
        copy="The current Branch head is required before a protected change can be reviewed."
      />
    );
  }
  const { data } = loadState;
  const fact = targetId
    ? (data.state.facts
        .filter((value) => isCurrentFactValue(value))
        .map((item) => currentFact(item))
        .find((item) => item?.id === targetId) ?? null)
    : null;
  if (!fact) {
    return (
      <StatusPage
        title="This correction target is not available"
        copy="Only an accessible active canonical fact can enter this correction path. Current truth was not changed."
      >
        <Link
          className="secondary-action inline-action"
          to={`/continuities/${encodeURIComponent(continuityId)}/continuity`}
        >
          Back to Continuity
        </Link>
      </StatusPage>
    );
  }
  const submit = async (): Promise<void> => {
    if (working) return;
    if (!reason.trim()) {
      setError("State why this exact correction or removal is needed before continuing.");
      return;
    }
    if (operation === "CORRECT_CONTINUITY" && !after.trim()) {
      setError("Write the exact replacement statement before continuing.");
      return;
    }
    const request: CorrectionRequest = {
      schemaVersion: 1,
      idempotencyKey: idempotencyKey.current ?? crypto.randomUUID(),
      expectedHeadCommitId: data.continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation,
      before: { statement: fact.statement, scope: fact.scope },
      reason: reason.trim(),
    };
    if (operation === "CORRECT_CONTINUITY") request.after = { statement: after.trim() };
    idempotencyKey.current = request.idempotencyKey;
    setWorking(true);
    setError(null);
    const result = await submitCorrection(request);
    setWorking(false);
    if (result.error || !result.action) {
      if (result.status === 409) {
        idempotencyKey.current = null;
        refresh().catch(() => undefined);
      }
      setError(result.error ?? "The correction response did not contain a durable Action.");
      return;
    }
    idempotencyKey.current = null;
    await navigate(
      `/continuities/${encodeURIComponent(continuityId)}/actions/${encodeURIComponent(result.action.id)}`,
    );
  };
  return (
    <div className="surface-page correction-page">
      <SurfaceHeader
        eyebrow="Direct correction review"
        title={operation === "REMOVE_CONTINUITY" ? "Request removal" : "Correct this fact"}
        copy="Review the exact target, before/after effect, scope and reason. Nothing changes until the returned Action is directly confirmed against the current head."
      />
      <section className="surface-card review-card" aria-labelledby="correction-target-title">
        <p className="card-label">Exact target</p>
        <h2 id="correction-target-title">{fact.statement}</h2>
        <dl className="metadata-list">
          <div>
            <dt>Stable target id</dt>
            <dd>{fact.id}</dd>
          </div>
          <div>
            <dt>Current scope</dt>
            <dd>{fact.scope}</dd>
          </div>
          <div>
            <dt>Current Branch head</dt>
            <dd>{shortId(data.continuity.headCommitId)}</dd>
          </div>
        </dl>
      </section>
      <section className="surface-card" aria-labelledby="correction-effect-title">
        <p className="card-label">Before / after</p>
        <h2 id="correction-effect-title">What would change</h2>
        <div className="effect-grid">
          <div>
            <span>Before</span>
            <p>{fact.statement}</p>
          </div>
          <div>
            <span>{operation === "REMOVE_CONTINUITY" ? "After removal" : "After correction"}</span>
            <p>
              {operation === "REMOVE_CONTINUITY"
                ? "This fact will no longer be active in current Continuity."
                : after || "Write the exact replacement below."}
            </p>
          </div>
        </div>
        <div className="operation-toggle" role="group" aria-label="Correction operation">
          <button
            type="button"
            className={operation === "CORRECT_CONTINUITY" ? "selected" : ""}
            onClick={() => setOperation("CORRECT_CONTINUITY")}
          >
            Replace statement
          </button>
          <button
            type="button"
            className={operation === "REMOVE_CONTINUITY" ? "selected" : ""}
            onClick={() => setOperation("REMOVE_CONTINUITY")}
          >
            Remove fact
          </button>
        </div>
        {operation === "CORRECT_CONTINUITY" ? (
          <label className="field-label" htmlFor="correction-after">
            Exact replacement statement
            <textarea
              id="correction-after"
              value={after}
              onChange={(event) => setAfter(event.target.value)}
              rows={4}
            />
          </label>
        ) : null}
        <label className="field-label" htmlFor="correction-reason">
          Reason for this direct correction
          <textarea
            id="correction-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
          />
        </label>
        <p className="muted-copy">
          Scope and provenance are not widened or edited by this surface. This review creates a
          protected Action; direct confirmation is still required.
        </p>
      </section>
      {error ? (
        <p className="action-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="review-actions">
        <button
          className="primary-action"
          type="button"
          disabled={working}
          onClick={() => void submit()}
        >
          {working ? "Preparing review…" : "Review exact correction"}
        </button>
        <Link
          className="secondary-action inline-action"
          to={`/continuities/${encodeURIComponent(continuityId)}/continuity`}
        >
          Cancel without changing truth
        </Link>
      </div>
    </div>
  );
}

function currentSituation(data: AuthoritativeStateResponse): string {
  return data.state.openThreads[0] ?? data.state.worldClock.label;
}

type CurrentFact = {
  id: string;
  statement: string;
  scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
  lifecycle?: "ACTIVE" | "SUPERSEDED" | "REMOVED";
};

function isCurrentFactValue(value: unknown): boolean {
  const item =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  const lifecycle = item?.lifecycle;
  return lifecycle === undefined || lifecycle === "ACTIVE";
}

function currentFact(value: unknown): CurrentFact | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  const id = readText(item, "id");
  const statement = readText(item, "statement");
  const scope = item.scope;
  if (!id || !statement || !isScope(scope)) return null;
  const lifecycle =
    item.lifecycle === "ACTIVE" || item.lifecycle === "SUPERSEDED" || item.lifecycle === "REMOVED"
      ? item.lifecycle
      : undefined;
  return { id, statement, scope, ...(lifecycle ? { lifecycle } : {}) };
}

function isScope(value: unknown): value is CurrentFact["scope"] {
  return value === "ACCOUNT_PRIVATE" || value === "CONTINUITY_PRIVATE" || value === "SHARED";
}

function fallbackOrientation(
  data: AuthoritativeStateResponse,
  continuityId: string,
): OrientationResponse {
  return {
    continuity: {
      id: data.continuity.id,
      branchId: data.continuity.branchId,
      worldRevisionId: data.continuity.worldRevisionId,
    },
    current: {
      situation: currentSituation(data),
      locationId: null,
      worldClock: data.state.worldClock,
    },
    recentChanges: [],
    relationships: data.state.relationships.map((item, index) => {
      const record =
        typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null;
      return {
        id: readText(record, "id") ?? `relationship-${index}`,
        description:
          readText(record, "description") ?? "A relationship is present in current state.",
      };
    }),
    openThreads: data.state.openThreads,
    nextParticipation: {
      expectedHeadCommitId: data.continuity.headCommitId,
      label: "Continue from the current world state with your next Action.",
    },
    pendingActions: [],
    freshness: {
      sourceHeadCommitId: data.continuity.headCommitId,
      currentHeadCommitId: data.continuity.headCommitId,
      status: "REBUILDING",
      headDistance: 0,
    },
    authoritativeFallback: {
      stateUrl: `/v1/continuities/${encodeURIComponent(continuityId)}/state`,
      headCommitId: data.continuity.headCommitId,
      stateRevisionId: data.continuity.stateRevisionId,
    },
    projectionUpdatedAt: null,
  };
}

function freshnessLabel(freshness: ProjectionFreshness): string {
  if (freshness.status === "FRESH") return "Current projection";
  if (freshness.status === "REBUILDING")
    return `Rebuilding · ${freshness.headDistance} head behind`;
  return `Stale · ${freshness.headDistance} head behind`;
}

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

export function NotFoundPage(): ReactElement {
  return (
    <StatusPage title="Route not found" copy="This production route has not been implemented yet.">
      <Link className="secondary-action inline-action" to="/">
        Return home
      </Link>
    </StatusPage>
  );
}
