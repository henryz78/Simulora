import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactElement,
  type SetStateAction,
} from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  type ActionResponse,
  type AuthoritativeStateResponse,
  type BranchTraceResponse,
  type CorrectionRequest,
  type DeletionProposal,
  type DeletionStatus,
  type ExplanationResponse,
  type ExportResponse,
  type OrientationResponse,
  type ProjectionFreshness,
  type ParticipationContract,
  type RecoveryResponse,
  type RestoreProposal,
  type UsageQuote,
  type WorldDocumentInput,
  type WorldStudioResponse,
  type WorldValidationResponse,
} from "@simulora/contracts";
import { worldDocumentInputSchema } from "@simulora/contracts";
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
import { changeParticipationContract } from "./ip6-api.js";
import {
  createWorld,
  createWorldRevision,
  readWorldStudio,
  startWorldContinuity,
  updateWorldDraft,
  validateWorldDraft,
} from "./ip7-api.js";
import {
  confirmDeletion,
  createExport,
  readExport,
  createUsageQuote,
  loadTrust,
  openAppeal,
  proposeDeletion,
  releaseUsage,
  reserveUsage,
  setConsent,
  type TrustLoad,
} from "./ip8-api.js";

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
        <span className="phase-badge">IP-8 · Trust & lifecycle</span>
      </header>
      <main id="main-content" className="foundation-main">
        <section className="hero" aria-labelledby="foundation-title">
          <p className="eyebrow">Production implementation</p>
          <h1 id="foundation-title">A durable world begins with a known source of truth.</h1>
          <p className="hero-copy">
            Durable Actions, Recovery and the two-axis Participation Contract now share one
            authoritative Branch/Commit/State Revision spine.
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
            <li>Only a direct user command can change participation authority.</li>
          </ul>
        </section>
        <section className="foundation-card" aria-labelledby="creator-entry-title">
          <p className="eyebrow">Create a personal world</p>
          <h2 id="creator-entry-title">Start with a playable core</h2>
          <p>
            Save a durable Draft, check what it changes in play, and create a new immutable Revision
            when you are ready. Existing Continuities stay pinned.
          </p>
          <Link className="primary-action inline-action" to="/worlds/new">
            Open World Studio
          </Link>
        </section>
      </main>
      <footer className="site-footer">Product Implementation · IP-8 Trust & lifecycle</footer>
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

const initiativeOptions: Array<{
  value: ParticipationContract["initiativeMode"];
  label: string;
  copy: string;
}> = [
  { value: "DIRECT", label: "Direct", copy: "The world responds to your explicit Actions." },
  {
    value: "GUIDED",
    label: "Guided",
    copy: "Characters may suggest and initiate bounded scene developments.",
  },
  {
    value: "WORLD_ACTIVE",
    label: "World-active",
    copy: "Background actors may advance only inside a user-triggered cycle.",
  },
];

const structureOptions: Array<{
  value: ParticipationContract["structureMode"];
  label: string;
  copy: string;
}> = [
  { value: "OPEN_ENDED", label: "Open-ended", copy: "No objective is fabricated." },
  {
    value: "GOAL_FRAMED",
    label: "Goal-framed",
    copy: "Only objectives declared by this World Revision are active.",
  },
];

export function ParticipationPage(): ReactElement {
  const { loadState, refresh } = useContinuity();
  const [requested, setRequested] = useState<ParticipationContract | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const current = loadState.status === "ready" ? loadState.data.state.participation : null;

  if (loadState.status !== "ready" || !current) {
    return (
      <StatusPage title="Opening participation…" copy="Reading the current Branch contract." />
    );
  }
  const selection = requested ?? current;

  const changed =
    current.initiativeMode !== selection.initiativeMode ||
    current.structureMode !== selection.structureMode;
  const update = (next: ParticipationContract) => {
    setRequested(next);
    setReviewing(false);
    setMessage(null);
    idempotencyKey.current = null;
  };

  const apply = async (): Promise<void> => {
    if (!changed || busy) return;
    setBusy(true);
    setMessage(null);
    idempotencyKey.current ??= crypto.randomUUID();
    const request = {
      schemaVersion: 1,
      idempotencyKey: idempotencyKey.current,
      expectedHeadCommitId: loadState.data.continuity.headCommitId,
      before: current,
      after: selection,
    } as const;
    let result = await changeParticipationContract(loadState.data.continuity.branchId, request);
    if (!result.data && !result.errorCode) {
      result = await changeParticipationContract(loadState.data.continuity.branchId, request);
    }
    if (result.data?.status === "COMMITTED") {
      idempotencyKey.current = null;
      setReviewing(false);
      await refresh();
      setMessage("Participation changed by one direct user Commit.");
    } else if (
      result.errorCode === "BRANCH_HEAD_CONFLICT" ||
      result.errorCode === "PARTICIPATION_EXPECTATION_MISMATCH"
    ) {
      idempotencyKey.current = null;
      await refresh();
      setReviewing(false);
      setMessage("The current path changed. Review its current contract before trying again.");
    } else {
      await refresh();
      setMessage(
        "The result could not be verified. Current truth was refreshed; retrying this exact review is safe.",
      );
    }
    setBusy(false);
  };

  return (
    <div className="surface-page participation-page">
      <SurfaceHeader
        eyebrow="Participation Contract"
        title="Choose how this world may lead"
        copy="Initiative and world structure are independent. Neither changes your authority over your avatar, speech, resources, sharing, deletion or irreversible commitments."
      />
      <section className="surface-card participation-contract" aria-labelledby="initiative-title">
        <fieldset>
          <legend id="initiative-title">AI initiative</legend>
          {initiativeOptions.map((option) => (
            <label key={option.value} className="contract-option">
              <input
                type="radio"
                name="initiative"
                checked={selection.initiativeMode === option.value}
                disabled={busy}
                onChange={() => update({ ...selection, initiativeMode: option.value })}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.copy}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>World structure</legend>
          {structureOptions.map((option) => (
            <label key={option.value} className="contract-option">
              <input
                type="radio"
                name="structure"
                checked={selection.structureMode === option.value}
                disabled={busy}
                onChange={() => update({ ...selection, structureMode: option.value })}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.copy}</small>
              </span>
            </label>
          ))}
        </fieldset>
      </section>
      <section className="surface-card contract-review" aria-live="polite">
        <p className="card-label">Before / after</p>
        <dl>
          <div>
            <dt>Current</dt>
            <dd>
              {labelMode(current.initiativeMode)} · {labelMode(current.structureMode)}
            </dd>
          </div>
          <div>
            <dt>Requested</dt>
            <dd>
              {labelMode(selection.initiativeMode)} · {labelMode(selection.structureMode)}
            </dd>
          </div>
        </dl>
        {!reviewing ? (
          <button
            className="primary-action"
            type="button"
            disabled={!changed}
            onClick={() => setReviewing(true)}
          >
            Review authority change
          </button>
        ) : (
          <div className="action-buttons">
            <p>
              This direct command changes only these two values. It does not authorize the world to
              act as you or create off-session mutations.
            </p>
            <button
              className="primary-action"
              type="button"
              disabled={busy}
              onClick={() => void apply()}
            >
              {busy ? "Applying…" : "Apply this exact contract"}
            </button>
            <button
              className="secondary-action"
              type="button"
              disabled={busy}
              onClick={() => setReviewing(false)}
            >
              Keep current contract
            </button>
          </div>
        )}
        {message ? <p role="status">{message}</p> : null}
      </section>
    </div>
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
              onChange={(event) => {
                setBranchSourceCommitId(event.target.value);
                branchKey.current = null;
              }}
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
                  setMessage(
                    "The Branch result could not be confirmed. Re-open Recovery to reconcile the durable Branch list before retrying.",
                  );
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
              {restore.status === "CONFIRMED" && restore.resultCommitId ? (
                <p role="status">
                  Restore recorded as Commit {shortId(restore.resultCommitId)}. Earlier and
                  intervening history remain.
                </p>
              ) : (
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
                        if (
                          recovered.data?.status === "CONFIRMED" &&
                          recovered.data.resultCommitId
                        ) {
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
                        if (recovered.data?.status === "EXPIRED") {
                          setRestore(null);
                          setMessage(
                            "The Restore review expired. Nothing was restored; prepare a new review.",
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
              )}
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
            disabled={working}
            onClick={() => setOperation("CORRECT_CONTINUITY")}
          >
            Replace statement
          </button>
          <button
            type="button"
            className={operation === "REMOVE_CONTINUITY" ? "selected" : ""}
            disabled={working}
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
              disabled={working}
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
            disabled={working}
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
  // Match the Return projection: historical thread text is not the current lead.
  return (
    data.state.facts
      .filter(isCurrentFactValue)
      .map(currentFact)
      .find((fact) => fact?.scope === "SHARED")?.statement ?? data.state.worldClock.label
  );
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

function readStoredWorldDraft(
  key: string,
): { draft: WorldDocumentInput; savedAt: number; raw: string } | null {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = JSON.parse(raw ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const envelope = parsed as { draft?: unknown; savedAt?: unknown };
    const draft = worldDocumentInputSchema.safeParse(envelope.draft ?? parsed);
    return draft.success
      ? {
          draft: draft.data,
          savedAt: typeof envelope.savedAt === "number" ? envelope.savedAt : 0,
          raw: raw ?? "null",
        }
      : null;
  } catch {
    return null;
  }
}

function findStoredWorldDraft(
  prefix: string,
  legacyKey: string,
): { key: string; draft: WorldDocumentInput; savedAt: number; raw: string } | null {
  const keys = [legacyKey];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  const stored = keys
    .map((key) => ({ key, stored: readStoredWorldDraft(key) }))
    .filter(
      (
        entry,
      ): entry is {
        key: string;
        stored: { draft: WorldDocumentInput; savedAt: number; raw: string };
      } => Boolean(entry.stored),
    )
    .sort((left, right) => right.stored.savedAt - left.stored.savedAt)[0];
  return stored
    ? {
        key: stored.key,
        draft: stored.stored.draft,
        savedAt: stored.stored.savedAt,
        raw: stored.stored.raw,
      }
    : null;
}

export function WorldStudioPage(): ReactElement {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const isNew = !worldId;
  const [draft, setDraft] = useState<WorldDocumentInput>(() => starterWorld());
  const [studio, setStudio] = useState<WorldStudioResponse | null>(null);
  const [validation, setValidation] = useState<WorldValidationResponse | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsentAvailable, setUnsentAvailable] = useState(false);
  const [unsentKey, setUnsentKey] = useState<string | null>(null);
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  const [restoredRaw, setRestoredRaw] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tabId] = useState(() => {
    const key = "simulora:world-studio-tab-id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(key, created);
    return created;
  });
  const storagePrefix = worldId ? `simulora:world-draft:${worldId}:` : null;
  const storageKey = storagePrefix ? `${storagePrefix}${tabId}` : null;
  const legacyStorageKey = worldId ? `simulora:world-draft:${worldId}` : null;
  const savedDraft = studio?.draft.document ?? null;
  const dirty = Boolean(savedDraft && JSON.stringify(savedDraft) !== JSON.stringify(draft));

  const load = async (): Promise<void> => {
    if (!worldId) return;
    setLoading(true);
    const result = await readWorldStudio(worldId);
    if (!result.data) {
      setError("This World is unavailable to this account. No local draft was published.");
      setLoading(false);
      return;
    }
    setStudio(result.data);
    setValidation(
      result.data.validation?.draftRowVersion === result.data.draft.rowVersion
        ? result.data.validation
        : null,
    );
    const local =
      storagePrefix && legacyStorageKey
        ? findStoredWorldDraft(storagePrefix, legacyStorageKey)
        : null;
    setUnsentKey(local?.key ?? null);
    setRestoredKey(null);
    setRestoredRaw(null);
    setUnsentAvailable(Boolean(local));
    setDraft(result.data.draft.document);
    setMessage(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (worldId) void load();
    // The route id is the only load dependency; edits must not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId]);

  useEffect(() => {
    if (!storageKey || !studio || !dirty) return;
    localStorage.setItem(storageKey, JSON.stringify({ draft, savedAt: Date.now() }));
  }, [draft, dirty, storageKey, studio]);

  const run = async (name: string, work: () => Promise<void>): Promise<void> => {
    if (busy) return;
    setBusy(name);
    setMessage(null);
    setError(null);
    try {
      await work();
    } catch {
      setError("The Studio request could not be completed. The current Draft remains unchanged.");
    } finally {
      setBusy(null);
    }
  };

  const save = async (): Promise<void> => {
    if (!worldId || !studio) return;
    await run("save", async () => {
      const result = await updateWorldDraft(worldId, studio.draft.rowVersion, draft);
      if (!result.data) {
        if (result.errorCode === "STALE_DRAFT") {
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify({ draft, savedAt: Date.now() }));
            setUnsentKey(storageKey);
          }
          setRestoredKey(null);
          setRestoredRaw(null);
          setUnsentAvailable(true);
          await load();
          setMessage(
            "This Draft changed elsewhere. Your unsent edits are kept locally; review the server Draft before saving again.",
          );
          return;
        }
        setError("The Draft could not be saved. Nothing was published.");
        return;
      }
      setDraft(result.data.document);
      setStudio((current) => (current ? { ...current, draft: result.data! } : current));
      setValidation(null);
      if (storageKey) localStorage.removeItem(storageKey);
      if (restoredKey && restoredKey !== storageKey && restoredRaw !== null) {
        if (localStorage.getItem(restoredKey) === restoredRaw) localStorage.removeItem(restoredKey);
      }
      setUnsentKey(null);
      setRestoredKey(null);
      setRestoredRaw(null);
      setUnsentAvailable(false);
      setMessage("Draft saved. Existing Continuities remain pinned to their earlier Revision.");
    });
  };

  const validate = async (): Promise<void> => {
    if (!worldId || !studio) return;
    if (dirty) {
      setMessage("Save this Draft before checking playability.");
      return;
    }
    await run("validate", async () => {
      const result = await validateWorldDraft(worldId);
      if (!result.data) {
        setError("Playability findings are unavailable. The Draft was not changed.");
        return;
      }
      setValidation(result.data);
      setMessage(
        result.data.outcome === "VALID"
          ? "This Draft can become a playable World Revision. Review the optional warnings below."
          : "The Draft needs the fixes below before a playable Revision can be created.",
      );
    });
  };

  const createRevision = async (): Promise<void> => {
    if (!worldId || !studio) return;
    if (
      dirty ||
      validation?.draftRowVersion !== studio.draft.rowVersion ||
      validation.outcome !== "VALID"
    ) {
      setMessage("Save and check this Draft before creating a playable Revision.");
      return;
    }
    await run("revision", async () => {
      const result = await createWorldRevision(worldId, studio.draft.rowVersion);
      if (!result.data) {
        setError(
          result.errorCode === "STALE_DRAFT"
            ? "The Draft changed. Reload it and review the current version before creating a Revision."
            : "The Revision was not created.",
        );
        return;
      }
      await load();
      setMessage(
        `Revision ${result.data.revisionNumber} created. It is not applied to existing Continuities.`,
      );
    });
  };

  const beginFromRevision = async (revisionId: string): Promise<void> => {
    await run("play", async () => {
      const result = await startWorldContinuity(revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      if (result.data) {
        await navigate(`/continuities/${encodeURIComponent(result.data.continuity.id)}`);
      } else {
        setError("The playable Revision exists, but its Continuity could not be started.");
      }
    });
  };

  const beginPlay = async (): Promise<void> => {
    if (!studio?.revisions[0]) return;
    const pinned = studio.continuities[0];
    if (pinned) {
      await navigate(`/continuities/${encodeURIComponent(pinned.continuityId)}`);
      return;
    }
    await beginFromRevision(studio.revisions[0].revisionId);
  };

  const create = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    await run("create", async () => {
      const result = await createWorld(draft);
      if (result.data) {
        await navigate(`/worlds/${encodeURIComponent(result.data.worldId)}/studio`);
      } else {
        setError(
          "The starter Draft could not be created. Complete the playable core and try again.",
        );
      }
    });
  };

  if (loading)
    return (
      <StatusPage
        title="Opening World Studio…"
        copy="Reading the durable Draft and its immutable Revisions."
      />
    );

  return (
    <main id="main-content" className="surface-page studio-page">
      <header className="surface-header studio-header">
        <div>
          <Link className="back-link" to="/">
            ← Back to Worlds
          </Link>
          <p className="eyebrow">World Studio</p>
          <h1>{isNew ? "Start a playable world" : draft.title}</h1>
          <p className="surface-copy">
            Build the playable core first. Deeper structure is optional, and a new Revision never
            silently changes an existing Continuity.
          </p>
        </div>
        {!isNew ? (
          <div className="review-actions">
            <Link
              className="secondary-action inline-action"
              to={`/worlds/${encodeURIComponent(worldId)}/trust`}
            >
              Trust & lifecycle
            </Link>
            {studio?.revisions[0] ? (
              <button
                className="primary-action"
                type="button"
                disabled={busy !== null}
                onClick={() => void beginPlay()}
              >
                {busy === "play"
                  ? "Opening…"
                  : studio.continuities.length
                    ? "Resume pinned Continuity"
                    : "Begin play"}
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="action-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="studio-message" role="status">
          {message}
        </p>
      ) : null}

      {isNew ? (
        <form className="studio-grid" onSubmit={(event) => void create(event)}>
          <StudioCoreFields draft={draft} setDraft={setDraft} />
          <section className="surface-card studio-safety" aria-labelledby="new-world-safety">
            <p className="card-label">Before you begin</p>
            <h2 id="new-world-safety">This is a Draft, not a hidden prompt</h2>
            <p>
              These structured values become the source for a future immutable World Revision. No
              model call or live provider is involved.
            </p>
            <button className="primary-action" type="submit" disabled={busy !== null}>
              {busy === "create" ? "Creating Draft…" : "Create Draft"}
            </button>
          </section>
        </form>
      ) : studio ? (
        <>
          {unsentAvailable ? (
            <section className="studio-unsent" aria-labelledby="unsent-title">
              <div>
                <strong id="unsent-title">Unsent edits are available on this device.</strong>
                <span>
                  They were kept after a conflict or interrupted save; the server Draft remains the
                  safe source.
                </span>
              </div>
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  const local = unsentKey ? readStoredWorldDraft(unsentKey) : null;
                  if (!local || !unsentKey) return;
                  try {
                    setDraft(local.draft);
                    setRestoredKey(unsentKey);
                    setRestoredRaw(local.raw);
                    setUnsentAvailable(false);
                    setMessage(
                      "Unsent edits restored locally. Save them intentionally after reviewing the current Draft.",
                    );
                  } catch {
                    localStorage.removeItem(unsentKey);
                    setUnsentKey(null);
                    setRestoredKey(null);
                    setRestoredRaw(null);
                    setUnsentAvailable(false);
                  }
                }}
              >
                Restore unsent edits
              </button>
            </section>
          ) : null}
          <div className="studio-grid">
            <StudioCoreFields draft={draft} setDraft={setDraft} />
            <section
              className="surface-card studio-readiness"
              aria-labelledby="studio-readiness-title"
            >
              <p className="card-label">Readiness</p>
              <h2 id="studio-readiness-title">Make the play effect visible</h2>
              <p>
                Save the Draft, then run a server-side playability check. Findings explain what a
                player will experience.
              </p>
              <div className="studio-actions">
                <button
                  className="secondary-action"
                  type="button"
                  disabled={busy !== null || !dirty}
                  onClick={() => void save()}
                >
                  {busy === "save" ? "Saving…" : "Save Draft"}
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={busy !== null || dirty}
                  onClick={() => void validate()}
                >
                  {busy === "validate" ? "Checking…" : "Check playability"}
                </button>
                <button
                  className="primary-action"
                  type="button"
                  disabled={
                    busy !== null ||
                    dirty ||
                    validation?.draftRowVersion !== studio.draft.rowVersion ||
                    validation.outcome !== "VALID"
                  }
                  onClick={() => void createRevision()}
                >
                  {busy === "revision" ? "Creating Revision…" : "Create playable Revision"}
                </button>
              </div>
              {validation ? (
                <ValidationFindings validation={validation} />
              ) : (
                <p className="empty-state">No check has been run for this Draft version yet.</p>
              )}
            </section>
            <section
              className="surface-card studio-optional"
              aria-labelledby="studio-optional-title"
            >
              <p className="card-label">Optional depth</p>
              <h2 id="studio-optional-title">Reveal more control only when it helps play</h2>
              <details>
                <summary>Preview the first scene</summary>
                <p>
                  This local preview is read-only. It does not create a Continuity or call a model.
                </p>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setPreviewOpen((open) => !open)}
                >
                  {previewOpen ? "Hide preview" : "Preview playable start"}
                </button>
                {previewOpen ? (
                  <div className="studio-preview">
                    <strong>{draft.title}</strong>
                    <p>{draft.startingSituation}</p>
                    <p>
                      {draft.characters[0]?.name} · {draft.characters[0]?.role}
                    </p>
                    <p>{draft.facts[0]?.statement}</p>
                  </div>
                ) : null}
              </details>
              <p className="muted-copy">
                Goals, sharing and professional engine controls are not part of this Studio path.
              </p>
            </section>
            <section
              className="surface-card studio-revisions"
              aria-labelledby="studio-revisions-title"
            >
              <p className="card-label">Change safety</p>
              <h2 id="studio-revisions-title">Draft and playable versions stay distinct</h2>
              <p>
                Existing Continuities remain pinned to their recorded Revision. Creating a newer
                Revision is an explicit future starting point.
              </p>
              <ul className="revision-list">
                {studio.revisions.length ? (
                  studio.revisions.map((revision) => (
                    <li key={revision.revisionId}>
                      <strong>Revision {revision.revisionNumber}</strong>
                      <span>
                        Source Draft v{revision.sourceDraftRowVersion} · immutable playable
                        definition
                      </span>
                      {studio.continuities
                        .filter((continuity) => continuity.worldRevisionId === revision.revisionId)
                        .map((continuity) => (
                          <Link
                            key={continuity.continuityId}
                            to={`/continuities/${encodeURIComponent(continuity.continuityId)}`}
                          >
                            Pinned Continuity · open current path
                          </Link>
                        ))}
                      {!studio.continuities.some(
                        (continuity) => continuity.worldRevisionId === revision.revisionId,
                      ) ? (
                        <button
                          className="secondary-action"
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void beginFromRevision(revision.revisionId)}
                        >
                          {busy === "play"
                            ? "Opening…"
                            : `Begin from Revision ${revision.revisionNumber}`}
                        </button>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li>
                    <span>No playable Revision yet. The current Draft is not applied.</span>
                  </li>
                )}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}

function StudioCoreFields({
  draft,
  setDraft,
}: {
  draft: WorldDocumentInput;
  setDraft: Dispatch<SetStateAction<WorldDocumentInput>>;
}): ReactElement {
  const lines = (value: string): string[] =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  const updateLocation = (id: string, patch: Partial<WorldDocumentInput["locations"][number]>) =>
    setDraft((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === id ? { ...location, ...patch } : location,
      ),
    }));
  const updateCharacter = (id: string, patch: Partial<WorldDocumentInput["characters"][number]>) =>
    setDraft((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === id ? { ...character, ...patch } : character,
      ),
    }));
  const updateFact = (id: string, patch: Partial<WorldDocumentInput["facts"][number]>) =>
    setDraft((current) => ({
      ...current,
      facts: current.facts.map((fact) => (fact.id === id ? { ...fact, ...patch } : fact)),
    }));
  const addLocation = () =>
    setDraft((current) => ({
      ...current,
      locations: [
        ...current.locations,
        {
          id: crypto.randomUUID(),
          name: `Place ${current.locations.length + 1}`,
          description: "Describe what makes this place matter to play.",
        },
      ],
    }));
  const removeLocation = (id: string) =>
    setDraft((current) => {
      if (current.locations.length === 1) return current;
      const locations = current.locations.filter((location) => location.id !== id);
      const fallback = locations[0]!.id;
      return {
        ...current,
        locations,
        characters: current.characters.map((character) =>
          character.locationId === id ? { ...character, locationId: fallback } : character,
        ),
        routineRoutes: current.routineRoutes?.filter(
          (route) => route.fromLocationId !== id && route.toLocationId !== id,
        ),
      };
    });
  const addCharacter = () =>
    setDraft((current) => ({
      ...current,
      characters: [
        ...current.characters,
        {
          id: crypto.randomUUID(),
          name: `Character ${current.characters.length + 1}`,
          role: "A person with a reason to be here",
          locationId: current.locations[0]!.id,
          motives: ["Act consistently with this role."],
          stance: "May disagree or refuse when their motives require it.",
          knowledgeFactIds: [],
        },
      ],
    }));
  const removeCharacter = (id: string) =>
    setDraft((current) => {
      if (current.characters.length === 1) return current;
      return {
        ...current,
        characters: current.characters.filter((character) => character.id !== id),
        relationships: current.relationships.filter(
          (relationship) =>
            relationship.fromCharacterId !== id && relationship.toCharacterId !== id,
        ),
      };
    });
  const addFact = () =>
    setDraft((current) => ({
      ...current,
      facts: [
        ...current.facts,
        {
          id: crypto.randomUUID(),
          statement: "A stable fact that should remain true at the start.",
          scope: "SHARED",
          provenance: "World creator Draft",
          lifecycle: "ACTIVE",
        },
      ],
    }));
  const removeFact = (id: string) =>
    setDraft((current) => {
      if (current.facts.length === 1) return current;
      return {
        ...current,
        facts: current.facts.filter((fact) => fact.id !== id),
        characters: current.characters.map((character) => ({
          ...character,
          knowledgeFactIds: character.knowledgeFactIds.filter((factId) => factId !== id),
        })),
      };
    });
  const addRoute = () =>
    setDraft((current) => {
      const [from, to] = current.locations;
      if (!from || !to) return current;
      return {
        ...current,
        routineRoutes: [
          ...(current.routineRoutes ?? []),
          { fromLocationId: from.id, toLocationId: to.id, label: "A route between these places." },
        ],
      };
    });
  const addRelationship = () =>
    setDraft((current) => {
      const [from, to] = current.characters;
      if (!from || !to) return current;
      return {
        ...current,
        relationships: [
          ...(current.relationships ?? []),
          {
            id: crypto.randomUUID(),
            fromCharacterId: from.id,
            toCharacterId: to.id,
            description: "Describe what connects these Characters.",
          },
        ],
      };
    });
  return (
    <section className="surface-card studio-core" aria-labelledby="studio-core-title">
      <p className="card-label">Playable core</p>
      <h2 id="studio-core-title">Edit only what matters for the first scene</h2>
      <label className="field-label" htmlFor="studio-title">
        World title
        <input
          id="studio-title"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>
      <label className="field-label" htmlFor="studio-premise">
        Premise
        <textarea
          id="studio-premise"
          rows={3}
          value={draft.premise}
          onChange={(event) => setDraft((current) => ({ ...current, premise: event.target.value }))}
        />
      </label>
      <label className="field-label" htmlFor="studio-situation">
        Starting situation
        <textarea
          id="studio-situation"
          rows={3}
          value={draft.startingSituation}
          onChange={(event) =>
            setDraft((current) => ({ ...current, startingSituation: event.target.value }))
          }
        />
      </label>
      <div className="studio-field-grid">
        <label className="field-label" htmlFor="studio-role">
          Your role
          <input
            id="studio-role"
            value={draft.userRole.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                userRole: { ...current.userRole, name: event.target.value },
              }))
            }
          />
        </label>
        <label className="field-label" htmlFor="studio-boundary">
          Authority boundary
          <input
            id="studio-boundary"
            value={draft.userRole.authorityBoundary}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                userRole: { ...current.userRole, authorityBoundary: event.target.value },
              }))
            }
          />
        </label>
      </div>
      <details className="studio-details" open>
        <summary>Places and Characters</summary>
        <p className="muted-copy">
          Add only the structure that changes how the first scene can play.
        </p>
        {draft.locations.map((location, index) => (
          <fieldset className="studio-repeatable" key={location.id}>
            <legend>Place {index + 1}</legend>
            <div className="studio-field-grid">
              <label className="field-label" htmlFor={`studio-location-name-${location.id}`}>
                Name
                <input
                  id={`studio-location-name-${location.id}`}
                  value={location.name}
                  onChange={(event) => updateLocation(location.id, { name: event.target.value })}
                />
              </label>
              <label className="field-label" htmlFor={`studio-location-description-${location.id}`}>
                Description
                <input
                  id={`studio-location-description-${location.id}`}
                  value={location.description}
                  onChange={(event) =>
                    updateLocation(location.id, { description: event.target.value })
                  }
                />
              </label>
            </div>
            <button
              className="text-action"
              type="button"
              disabled={draft.locations.length === 1}
              onClick={() => removeLocation(location.id)}
            >
              Remove place
            </button>
          </fieldset>
        ))}
        <button className="secondary-action" type="button" onClick={addLocation}>
          Add place
        </button>
        {draft.characters.map((character, index) => (
          <fieldset className="studio-repeatable" key={character.id}>
            <legend>Character {index + 1}</legend>
            <div className="studio-field-grid">
              <label className="field-label" htmlFor={`studio-character-name-${character.id}`}>
                Name
                <input
                  id={`studio-character-name-${character.id}`}
                  value={character.name}
                  onChange={(event) => updateCharacter(character.id, { name: event.target.value })}
                />
              </label>
              <label className="field-label" htmlFor={`studio-character-role-${character.id}`}>
                Role
                <input
                  id={`studio-character-role-${character.id}`}
                  value={character.role}
                  onChange={(event) => updateCharacter(character.id, { role: event.target.value })}
                />
              </label>
            </div>
            <label className="field-label" htmlFor={`studio-character-location-${character.id}`}>
              Starts at
              <select
                id={`studio-character-location-${character.id}`}
                value={character.locationId}
                onChange={(event) =>
                  updateCharacter(character.id, { locationId: event.target.value })
                }
              >
                {draft.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label" htmlFor={`studio-character-motives-${character.id}`}>
              Motives (one per line)
              <textarea
                id={`studio-character-motives-${character.id}`}
                rows={2}
                value={character.motives.join("\n")}
                onChange={(event) =>
                  updateCharacter(character.id, { motives: lines(event.target.value) })
                }
              />
            </label>
            <label className="field-label" htmlFor={`studio-character-stance-${character.id}`}>
              Stance
              <textarea
                id={`studio-character-stance-${character.id}`}
                rows={2}
                value={character.stance}
                onChange={(event) => updateCharacter(character.id, { stance: event.target.value })}
              />
            </label>
            <fieldset className="studio-checks">
              <legend>Knowledge</legend>
              {draft.facts.map((fact) => (
                <label key={fact.id}>
                  <input
                    type="checkbox"
                    checked={character.knowledgeFactIds.includes(fact.id)}
                    onChange={(event) =>
                      updateCharacter(character.id, {
                        knowledgeFactIds: event.target.checked
                          ? [...character.knowledgeFactIds, fact.id]
                          : character.knowledgeFactIds.filter((factId) => factId !== fact.id),
                      })
                    }
                  />
                  {fact.statement}
                </label>
              ))}
            </fieldset>
            <button
              className="text-action"
              type="button"
              disabled={draft.characters.length === 1}
              onClick={() => removeCharacter(character.id)}
            >
              Remove Character
            </button>
          </fieldset>
        ))}
        <button className="secondary-action" type="button" onClick={addCharacter}>
          Add Character
        </button>
      </details>
      <details className="studio-details">
        <summary>Facts, routes, relationships and boundaries</summary>
        {draft.facts.map((fact, index) => (
          <fieldset className="studio-repeatable" key={fact.id}>
            <legend>Fact {index + 1}</legend>
            <label className="field-label" htmlFor={`studio-fact-${fact.id}`}>
              Statement
              <textarea
                id={`studio-fact-${fact.id}`}
                rows={2}
                value={fact.statement}
                onChange={(event) => updateFact(fact.id, { statement: event.target.value })}
              />
            </label>
            <div className="studio-field-grid">
              <label className="field-label" htmlFor={`studio-provenance-${fact.id}`}>
                Provenance
                <input
                  id={`studio-provenance-${fact.id}`}
                  value={fact.provenance}
                  onChange={(event) => updateFact(fact.id, { provenance: event.target.value })}
                />
              </label>
              <label className="field-label" htmlFor={`studio-scope-${fact.id}`}>
                Scope
                <select
                  id={`studio-scope-${fact.id}`}
                  value={fact.scope}
                  onChange={(event) =>
                    updateFact(fact.id, {
                      scope: event.target.value as typeof fact.scope,
                    })
                  }
                >
                  <option value="SHARED">Shared</option>
                  <option value="CONTINUITY_PRIVATE">Continuity private</option>
                  <option value="ACCOUNT_PRIVATE">Account private</option>
                </select>
              </label>
            </div>
            <button
              className="text-action"
              type="button"
              disabled={draft.facts.length === 1}
              onClick={() => removeFact(fact.id)}
            >
              Remove fact
            </button>
          </fieldset>
        ))}
        <button className="secondary-action" type="button" onClick={addFact}>
          Add fact
        </button>
        <h3>Routine routes</h3>
        {(draft.routineRoutes ?? []).map((route, index) => (
          <fieldset
            className="studio-repeatable"
            key={`${route.fromLocationId}-${route.toLocationId}-${index}`}
          >
            <legend>Route {index + 1}</legend>
            <div className="studio-field-grid">
              <label className="field-label">
                From
                <select
                  value={route.fromLocationId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      routineRoutes: current.routineRoutes?.map((item, routeIndex) =>
                        routeIndex === index
                          ? { ...item, fromLocationId: event.target.value }
                          : item,
                      ),
                    }))
                  }
                >
                  {draft.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                To
                <select
                  value={route.toLocationId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      routineRoutes: current.routineRoutes?.map((item, routeIndex) =>
                        routeIndex === index ? { ...item, toLocationId: event.target.value } : item,
                      ),
                    }))
                  }
                >
                  {draft.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field-label">
              What changes along this route?
              <input
                value={route.label}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    routineRoutes: current.routineRoutes?.map((item, routeIndex) =>
                      routeIndex === index ? { ...item, label: event.target.value } : item,
                    ),
                  }))
                }
              />
            </label>
            <button
              className="text-action"
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  routineRoutes: current.routineRoutes?.filter(
                    (_, routeIndex) => routeIndex !== index,
                  ),
                }))
              }
            >
              Remove route
            </button>
          </fieldset>
        ))}
        <button
          className="secondary-action"
          type="button"
          disabled={draft.locations.length < 2}
          onClick={addRoute}
        >
          Add route
        </button>
        <h3>Character relationships</h3>
        {(draft.relationships ?? []).map((relationship, index) => (
          <fieldset className="studio-repeatable" key={relationship.id}>
            <legend>Relationship {index + 1}</legend>
            <div className="studio-field-grid">
              <label className="field-label">
                From
                <select
                  value={relationship.fromCharacterId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      relationships: current.relationships.map((item, relationshipIndex) =>
                        relationshipIndex === index
                          ? { ...item, fromCharacterId: event.target.value }
                          : item,
                      ),
                    }))
                  }
                >
                  {draft.characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                To
                <select
                  value={relationship.toCharacterId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      relationships: current.relationships.map((item, relationshipIndex) =>
                        relationshipIndex === index
                          ? { ...item, toCharacterId: event.target.value }
                          : item,
                      ),
                    }))
                  }
                >
                  {draft.characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field-label">
              Description
              <input
                value={relationship.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    relationships: current.relationships.map((item, relationshipIndex) =>
                      relationshipIndex === index
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  }))
                }
              />
            </label>
            <button
              className="text-action"
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  relationships: current.relationships.filter(
                    (_, relationshipIndex) => relationshipIndex !== index,
                  ),
                }))
              }
            >
              Remove relationship
            </button>
          </fieldset>
        ))}
        <button
          className="secondary-action"
          type="button"
          disabled={draft.characters.length < 2}
          onClick={addRelationship}
        >
          Add relationship
        </button>
        <label className="field-label" htmlFor="studio-paths">
          Interaction paths
          <textarea
            id="studio-paths"
            rows={3}
            value={draft.interactionPaths.join("\n")}
            onChange={(event) =>
              setDraft((current) => ({ ...current, interactionPaths: lines(event.target.value) }))
            }
          />
        </label>
        <label className="field-label" htmlFor="studio-boundaries">
          Interaction boundaries
          <textarea
            id="studio-boundaries"
            rows={3}
            value={draft.interactionBoundaries.join("\n")}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                interactionBoundaries: lines(event.target.value),
              }))
            }
          />
        </label>
        <label className="field-label" htmlFor="studio-objectives">
          Optional objectives
          <textarea
            id="studio-objectives"
            rows={2}
            value={draft.objectives.join("\n")}
            onChange={(event) =>
              setDraft((current) => ({ ...current, objectives: lines(event.target.value) }))
            }
          />
        </label>
      </details>
    </section>
  );
}

function ValidationFindings({ validation }: { validation: WorldValidationResponse }): ReactElement {
  return (
    <div className={`validation-findings validation-${validation.outcome.toLowerCase()}`}>
      <strong>
        {validation.outcome === "VALID"
          ? "Playable shape accepted"
          : "Playable shape needs attention"}
      </strong>
      {validation.findings.length ? (
        <ul>
          {validation.findings.map((finding, index) => (
            <li key={`${finding.path}:${index}`}>
              <strong>
                {finding.severity === "ERROR" ? "Blocks Revision" : "Optional warning"} ·{" "}
                {finding.path}
              </strong>
              <span>{finding.message}</span>
              <small>Play effect: {finding.playEffect}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No findings for this Draft version.</p>
      )}
    </div>
  );
}

function starterWorld(): WorldDocumentInput {
  const locationId = crypto.randomUUID();
  const characterId = crypto.randomUUID();
  const factId = crypto.randomUUID();
  return {
    schemaVersion: 1,
    title: "A new world",
    premise: "A place with room for a continuing story.",
    startingSituation: "Something has changed, and the first choice is yours.",
    userRole: {
      name: "Witness",
      authorityBoundary: "The world never authors my speech or commitments.",
    },
    locations: [
      {
        id: locationId,
        name: "The starting place",
        description: "A place where the first scene can begin.",
      },
    ],
    characters: [
      {
        id: characterId,
        name: "A local guide",
        role: "A person who knows this place",
        locationId,
        motives: ["Act consistently with this role."],
        stance: "May disagree or refuse when their motives require it.",
        knowledgeFactIds: [factId],
      },
    ],
    facts: [
      {
        id: factId,
        statement: "The first scene is ready to unfold.",
        scope: "SHARED",
        provenance: "World creator Draft",
        lifecycle: "ACTIVE",
      },
    ],
    relationships: [],
    interactionPaths: ["Look around and choose what to follow."],
    interactionBoundaries: ["The world never authors the user's speech, consent or commitments."],
    objectives: [],
  };
}

const consentLabels = {
  TERMS: "Terms and ownership boundary",
  PRIVACY: "Privacy and retention notice",
  CONTENT_BOUNDARIES: "Content and participation boundaries",
} as const;

export function TrustLifecyclePage(): ReactElement {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const [trust, setTrust] = useState<TrustLoad | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<UsageQuote | null>(null);
  const [exported, setExported] = useState<ExportResponse | null>(null);
  // A delayed export keeps its reservation open until the artifact is stored, so
  // settlement never runs ahead of a downloadable result.
  const [include, setInclude] = useState({
    world: true,
    characters: true,
    continuity: true,
    history: true,
  });
  const [deletion, setDeletion] = useState<DeletionProposal | null>(null);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [appealSummary, setAppealSummary] = useState("");

  const reload = async (): Promise<void> => {
    if (!worldId) return;
    const result = await loadTrust(worldId);
    if (result.data) {
      setTrust(result.data);
      setError(null);
    } else {
      setError("Trust and lifecycle information is unavailable. No World data was changed.");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // The route id is the only load dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId]);

  const run = async (name: string, work: () => Promise<void>): Promise<void> => {
    if (busy) return;
    setBusy(name);
    setMessage(null);
    setError(null);
    try {
      await work();
    } catch {
      setError("The request could not be completed. Existing World state remains unchanged.");
    } finally {
      setBusy(null);
    }
  };

  const refreshPendingExport = async (): Promise<void> => {
    if (!exported || exported.status !== "PENDING") return;
    const result = await readExport(exported.exportId);
    if (!result.data) return;
    // Storing the export settles its reservation on the server.
    if (result.data.status === "READY") {
      setMessage("Export ready. The in-product World remains unchanged.");
    }
    setExported(result.data);
  };

  const pendingExportId = exported?.status === "PENDING" ? exported.exportId : null;
  useEffect(() => {
    if (!pendingExportId) return;
    // The worker retries storage in the background; a few quiet checks let the
    // page notice without asking the person to keep pressing a button.
    let checks = 0;
    const timer = window.setInterval(() => {
      checks += 1;
      if (checks > 15) window.clearInterval(timer);
      else void refreshPendingExport();
    }, 4000);
    return () => window.clearInterval(timer);
    // Re-arm only when a different export becomes pending.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingExportId]);

  if (!worldId)
    return <StatusPage title="This path is incomplete" copy="A World id is required." />;
  if (loading)
    return (
      <StatusPage
        title="Opening Trust & lifecycle…"
        copy="Reading current access, consent and ownership records."
      />
    );
  if (!trust)
    return (
      <StatusPage
        title="Trust information is unavailable"
        copy={error ?? "No lifecycle operation was performed."}
      >
        <Link className="secondary-action inline-action" to={`/worlds/${worldId}/studio`}>
          Return to Studio
        </Link>
      </StatusPage>
    );

  return (
    <main id="main-content" className="surface-page trust-page">
      <header className="surface-header">
        <div>
          <Link className="back-link" to={`/worlds/${encodeURIComponent(worldId)}/studio`}>
            ← Back to World Studio
          </Link>
          <p className="eyebrow">Trust & lifecycle</p>
          <h1>Ownership, portability and exit</h1>
          <p className="surface-copy">
            Review who can act, what an export contains, and what deletion will close before making
            a consequential choice.
          </p>
        </div>
      </header>

      {error ? (
        <p className="action-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="studio-message" role="status">
          {message}
        </p>
      ) : null}

      <div className="trust-grid">
        <section className="surface-card" aria-labelledby="access-title">
          <p className="card-label">Current account and World</p>
          <h2 id="access-title">Access is explicit</h2>
          <dl className="trust-facts">
            <div>
              <dt>Eligibility</dt>
              <dd>{trust.me.reasonCode?.replaceAll("_", " ") ?? trust.me.eligibility}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{trust.access.accessLevel}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>{trust.access.visibility.replaceAll("_", " ")}</dd>
            </div>
          </dl>
          <p>{trust.access.explanation}</p>
          <p className="boundary-note">
            World ownership or a World grant never grants another account access to a private
            Continuity.
          </p>
        </section>

        <section className="surface-card" aria-labelledby="consent-title">
          <p className="card-label">Policy {trust.consents.policyVersion}</p>
          <h2 id="consent-title">Consent records</h2>
          <ul className="trust-list">
            {Object.entries(consentLabels).map(([type, label]) => {
              const consentType = type as keyof typeof consentLabels;
              const current = trust.consents.consents.find(
                (record) => record.consentType === consentType && record.version === "IP-8-V1",
              );
              return (
                <li key={type}>
                  <span>
                    <strong>{label}</strong>
                    <small>{current?.decision ?? "NOT RECORDED"}</small>
                  </span>
                  <button
                    className="text-action"
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      void run(`consent-${type}`, async () => {
                        const result = await setConsent({
                          schemaVersion: 1,
                          idempotencyKey: crypto.randomUUID(),
                          consentType,
                          version: "IP-8-V1",
                          scope: "ACCOUNT",
                          decision: current?.decision === "GRANTED" ? "WITHDRAWN" : "GRANTED",
                        });
                        if (!result.data) {
                          setError("The consent record was not changed.");
                          return;
                        }
                        await reload();
                        setMessage(`Consent recorded as ${result.data.decision.toLowerCase()}.`);
                      })
                    }
                  >
                    {current?.decision === "GRANTED" ? "Withdraw" : "Grant"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card trust-wide" aria-labelledby="export-title">
          <p className="card-label">Selected-scope portable ZIP</p>
          <h2 id="export-title">Export a readable copy</h2>
          <p>
            The package includes only selected owner-authorized World data, a versioned manifest and
            checksums. It excludes provider prompts, secrets and other accounts’ private data.
          </p>
          <fieldset className="trust-checks">
            <legend>Include</legend>
            {Object.entries(include).map(([scope, selected]) => (
              <label key={scope}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) =>
                    setInclude((current) => ({ ...current, [scope]: event.target.checked }))
                  }
                />
                {scope}
              </label>
            ))}
          </fieldset>
          {!quote ? (
            <button
              className="secondary-action"
              type="button"
              disabled={busy !== null || !Object.values(include).some(Boolean)}
              onClick={() =>
                void run("quote", async () => {
                  const result = await createUsageQuote({
                    schemaVersion: 1,
                    idempotencyKey: crypto.randomUUID(),
                    actionProfile: "EXPORT",
                  });
                  if (!result.data) return setError("The export usage quote is unavailable.");
                  setQuote(result.data);
                  setMessage("Usage reviewed. Creating this export consumes zero test units.");
                })
              }
            >
              Review export usage
            </button>
          ) : (
            <div className="trust-review">
              <strong>{quote.costMode.replaceAll("_", " ")} · 0 units</strong>
              <p>{quote.failureBehavior.terminalNoCommit}</p>
              <div className="review-actions">
                <button
                  className="primary-action"
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    void run("export", async () => {
                      const idempotencyKey = crypto.randomUUID();
                      const reserved = await reserveUsage(quote.quoteId, {
                        schemaVersion: 1,
                        actionKey: `export:${idempotencyKey}`,
                      });
                      if (!reserved.data) return setError("The usage reservation was not created.");
                      const result = await createExport({
                        schemaVersion: 1,
                        idempotencyKey,
                        reservationId: reserved.data.reservationId,
                        worldId,
                        include,
                      });
                      if (result.data?.status === "PENDING") {
                        setExported(result.data);
                        setQuote(null);
                        return setMessage(
                          "Export built and checksummed. Storage is delayed, so it is not downloadable yet; it will finish automatically. The in-product World remains unchanged.",
                        );
                      }
                      if (!result.data || result.data.status !== "READY") {
                        await releaseUsage(reserved.data.reservationId);
                        return setError(
                          "The export artifact was not created; its zero-unit reservation was released. Retry creates a separate reviewed job.",
                        );
                      }
                      setExported(result.data);
                      setQuote(null);
                      setMessage("Export ready. The in-product World remains unchanged.");
                    })
                  }
                >
                  Create selected export
                </button>
                <button className="secondary-action" type="button" onClick={() => setQuote(null)}>
                  Cancel unchanged
                </button>
              </div>
            </div>
          )}
          {exported?.status === "PENDING" ? (
            <div className="trust-result">
              <strong>Export storage delayed</strong>
              <span>SHA-256 {exported.checksum}</span>
              <span>
                {exported.delay?.message ??
                  "The export is built and checksummed and is waiting to be stored."}
              </span>
              <button
                className="secondary-action inline-action"
                type="button"
                disabled={busy !== null}
                onClick={() => void run("export-check", refreshPendingExport)}
              >
                {busy === "export-check" ? "Checking…" : "Check export again"}
              </button>
            </div>
          ) : exported && exported.status !== "READY" ? (
            <div className="trust-result">
              <strong>Export not available</strong>
              <span>
                {exported.status === "REVOKED"
                  ? "This export was revoked, so it can no longer be downloaded. The in-product World is unaffected."
                  : "This export could not be completed and cannot be downloaded. Create a new export to try again; the in-product World is unaffected."}
              </span>
            </div>
          ) : exported ? (
            <div className="trust-result">
              <strong>Export ready</strong>
              <span>SHA-256 {exported.checksum}</span>
              <span>Selected: {exported.selectedScopes.join(", ")}</span>
              <a
                className="secondary-action inline-action"
                href={`/v1/exports/${encodeURIComponent(exported.exportId)}/artifact`}
              >
                Download ZIP
              </a>
            </div>
          ) : null}
        </section>

        <section className="surface-card" aria-labelledby="changes-title">
          <p className="card-label">Material changes</p>
          <h2 id="changes-title">What changed</h2>
          <ul className="trust-list">
            {trust.changes.changes.map((change) => (
              <li key={change.id}>
                <span>
                  <strong>{change.summary}</strong>
                  <small>{change.effect}</small>
                  <small>Recovery: {change.recovery}</small>
                  <small>Affected: {change.affectedScopes.join(", ")}</small>
                  <small>Effective: {new Date(change.effectiveAt).toLocaleString()}</small>
                  <small>Choices: {change.availableChoices.join(", ")}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card" aria-labelledby="appeal-title">
          <p className="card-label">Recovery and review</p>
          <h2 id="appeal-title">Open an appeal</h2>
          <label className="field-label" htmlFor="appeal-summary">
            What needs review?
            <textarea
              id="appeal-summary"
              rows={3}
              value={appealSummary}
              onChange={(event) => setAppealSummary(event.target.value)}
            />
          </label>
          <button
            className="secondary-action"
            type="button"
            disabled={busy !== null || !appealSummary.trim()}
            onClick={() =>
              void run("appeal", async () => {
                const result = await openAppeal({
                  schemaVersion: 1,
                  idempotencyKey: crypto.randomUUID(),
                  reasonCode: "ACCESS",
                  subjectType: "WORLD",
                  subjectId: worldId,
                  summary: appealSummary,
                });
                if (!result.data) return setError("The appeal was not recorded.");
                setAppealSummary("");
                setMessage(
                  `Appeal ${result.data.appealId.slice(0, 8)} is ${result.data.status.toLowerCase()}.`,
                );
              })
            }
          >
            Open appeal
          </button>
        </section>

        <section className="surface-card trust-wide danger-card" aria-labelledby="delete-title">
          <p className="card-label">Separate lifecycle boundary</p>
          <h2 id="delete-title">Delete this World</h2>
          <p>
            Delete is not Restore, Branch or correction. Confirmation tombstones the World, blocks
            new mutation, revokes grants and exported artifacts, and retains only the stated audit
            boundary pending an approved purge policy.
          </p>
          {!deletion && !deletionStatus ? (
            <button
              className="secondary-action"
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void run("deletion-preview", async () => {
                  const result = await proposeDeletion({
                    schemaVersion: 1,
                    idempotencyKey: crypto.randomUUID(),
                    targetType: "WORLD",
                    targetId: worldId,
                  });
                  if (!result.data) return setError("The deletion effect could not be calculated.");
                  setDeletion(result.data);
                  setMessage("Deletion effect calculated. Nothing has been deleted.");
                })
              }
            >
              Review deletion effect
            </button>
          ) : null}
          {deletion ? (
            <div className="trust-review">
              <strong>Exact deletion review</strong>
              <ul>
                <li>{deletion.affected.continuities} Continuities become unavailable.</li>
                <li>{deletion.affected.grants} active grants are revoked.</li>
                <li>{deletion.affected.exports} ready exports are revoked.</li>
              </ul>
              <p>{deletion.explanation}</p>
              <div className="review-actions">
                <button
                  className="primary-action danger-action"
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    void run("delete", async () => {
                      const result = await confirmDeletion({
                        schemaVersion: 1,
                        proposalId: deletion.proposalId,
                        digest: deletion.digest,
                        idempotencyKey: crypto.randomUUID(),
                      });
                      if (!result.data)
                        return setError(
                          "Deletion was not confirmed; do not assume the World changed.",
                        );
                      setDeletion(null);
                      setDeletionStatus(result.data);
                      setMessage("World tombstoned. New World mutations are blocked.");
                    })
                  }
                >
                  Confirm exact deletion
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setDeletion(null)}
                >
                  Cancel unchanged
                </button>
              </div>
            </div>
          ) : null}
          {deletionStatus ? (
            <div className="trust-result">
              <strong>{deletionStatus.status}</strong>
              <span>Purge status: {deletionStatus.purgeStatus.replaceAll("_", " ")}</span>
              <small>
                Confirmed means the World is tombstoned and blocked from further change. A
                background purge worker is not part of this phase, so the stored data is retained
                under minimal audit rather than erased.
              </small>
              <button className="secondary-action" type="button" onClick={() => void navigate("/")}>
                Return to Worlds
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
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
