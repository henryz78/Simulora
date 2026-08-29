/**
 * P4 World Studio — approved hybrid direction:
 * Living Draft is the first layer; Fieldbook clarity appears only when a
 * creator is making a meaningful structure proposal. This is prototype-only
 * local state. It never writes to the shared current-world truth.
 */
import { useState } from "react";

type RecordId = `C-${number}`;
type StudioDraftState = {
  structureEnabled: boolean;
  kept: boolean;
};

type WorldStudioProps = {
  currentRecord: RecordId | null;
  beacon: "unlit" | "lit";
  maren: "watching" | "waiting";
  watchPledged: boolean;
  draft: StudioDraftState;
  onDraftChange: (draft: StudioDraftState) => void;
  onReturnWorld: () => void;
};

type StudioPanel = "draft" | "review";

const continuityRevision = "R-03";
const proposedRevision = "R-04";

function ContinuityBadge({ currentRecord }: { currentRecord: RecordId | null }) {
  return (
    <div className="studio-continuity-badge" aria-label="Current continuity boundary">
      <span className="studio-badge-dot" />
      <span>
        <small>Current Continuity</small>
        <strong>{continuityRevision} · {currentRecord ? `${currentRecord} applies` : "baseline"}</strong>
      </span>
    </div>
  );
}

function WorldFirstPanel({ currentRecord, beacon, maren, watchPledged, onReturnWorld }: WorldStudioProps) {
  const stateCopy = `${beacon === "lit" ? "The beacon is lit" : "The beacon is unlit"} and Maren is ${watchPledged ? "holding the north-water watch" : maren}. ${currentRecord ? `${currentRecord} is the latest record on this path.` : "No confirmed change has been recorded yet."}`;

  return (
    <section className="studio-world-panel" aria-labelledby="studio-world-title">
      <div className="studio-panel-kicker"><span className="eyebrow-dot" />Playable world</div>
      <div className="studio-world-heading">
        <div>
          <div className="breadcrumb studio-breadcrumb"><span>Greyhaven</span><span>·</span><span>Harbor path</span></div>
          <h1 id="studio-world-title">Start with the world that already lives.</h1>
        </div>
        <ContinuityBadge currentRecord={currentRecord} />
      </div>
      <div className={`studio-scene ${beacon === "lit" ? "studio-scene-lit" : ""}`}>
        <div className="studio-scene-glow" />
        <div className="studio-scene-label">East breakwater · Day 18, dusk</div>
        <p>The harbor waits for the tide to decide.</p>
        <span>{stateCopy}</span>
      </div>
      <div className="studio-world-footer">
        <p>Play, observe, and return here at any time. A Studio draft is a proposal beside this world, never a silent rewrite.</p>
        <button className="button-paper" onClick={onReturnWorld}>Return to playable world</button>
      </div>
    </section>
  );
}

function StructureSection({ enabled, onToggle, onReview }: { enabled: boolean; onToggle: () => void; onReview: () => void }) {
  return (
    <section className="studio-card studio-structure-card" aria-labelledby="studio-structure-title">
      <div className="studio-card-heading">
        <div>
          <div className="card-kicker">Meaningful structure</div>
          <h2 id="studio-structure-title">Give the next scene something to carry.</h2>
        </div>
        <span className={`studio-status-pill ${enabled ? "is-draft" : ""}`}>{enabled ? "Draft" : "Optional"}</span>
      </div>
      <p className="studio-card-copy">Choose one clear pressure, motive, and consequence. This shapes future possibilities without changing what is true in Greyhaven now.</p>
      <div className="studio-fieldbook-grid">
        <div className="studio-fieldbook-entry">
          <span className="studio-entry-index">01 · Motive</span>
          <strong>Protect the northbound crossing</strong>
          <small>Maren will weigh safety against your request.</small>
        </div>
        <div className="studio-fieldbook-entry">
          <span className="studio-entry-index">02 · Pressure</span>
          <strong>The tide turns in 43 minutes</strong>
          <small>Time makes the next choice matter, not mandatory.</small>
        </div>
        <div className="studio-fieldbook-entry">
          <span className="studio-entry-index">03 · Consequence</span>
          <strong>A refusal opens another route</strong>
          <small>Failure creates a new state instead of ending the world.</small>
        </div>
      </div>
      <div className="studio-structure-actions">
        <button className={enabled ? "button-ghost" : "button-dark"} aria-pressed={enabled} onClick={onToggle}>
          {enabled ? "Remove from draft" : "Add this structure to draft"}
        </button>
        <button className="button-ghost studio-review-button" disabled={!enabled} onClick={onReview}>
          Review revision proposal
        </button>
      </div>
      <p className="studio-boundary-note" aria-live="polite">
        <span>↳</span>{enabled ? `Draft held for ${proposedRevision}; current Continuity remains ${continuityRevision}.` : "Nothing is proposed yet. The playable world remains the only active layer."}
      </p>
    </section>
  );
}

function OptionalDepth({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="studio-card studio-depth-card" aria-labelledby="studio-depth-title">
      <div className="studio-card-heading">
        <div>
          <div className="card-kicker">Optional depth</div>
          <h2 id="studio-depth-title">Go deeper only when the world asks for it.</h2>
        </div>
        <button className="details-disclosure studio-depth-toggle" aria-expanded={open} onClick={onToggle}>{open ? "Hide notes" : "Show notes"}<span>{open ? "−" : "+"}</span></button>
      </div>
      <p className="studio-card-copy">Advanced relationships and causal views can wait. They are a later lens, not a gate before play.</p>
      {open && <div className="studio-depth-note"><span className="studio-entry-index">Later lens</span><p>A richer constellation may help advanced creators inspect chains of consequence. It is deliberately not part of this core path.</p></div>}
    </section>
  );
}

function RevisionReview({ currentRecord, onBack, onKeep, onReturnWorld }: { currentRecord: RecordId | null; onBack: () => void; onKeep: () => void; onReturnWorld: () => void }) {
  return (
    <section className="studio-review-surface" aria-labelledby="studio-review-title">
      <div className="studio-review-topline">
        <div>
          <div className="studio-panel-kicker"><span className="eyebrow-dot" />Fieldbook review</div>
          <h2 id="studio-review-title">Revision proposal {proposedRevision}</h2>
        </div>
        <button className="button-small" onClick={onBack}>Close</button>
      </div>
      <p className="studio-review-lede">A proposed structure can be inspected before it is ever allowed to shape a future run.</p>
      <div className="studio-review-status"><span className="studio-status-dot" /><strong>Draft · not applied</strong><span>Prepared from the current playable world</span></div>
      <div className="studio-ledger">
        <div className="studio-ledger-row"><span>Proposed structure</span><strong>Protect the northbound crossing</strong><p>Maren weighs safety, the tide creates pressure, and a refusal opens another route.</p></div>
        <div className="studio-ledger-row"><span>Would affect</span><strong>Future scenes after {proposedRevision}</strong><p>New possibilities, motives, and consequence prompts in a later world revision.</p></div>
        <div className="studio-ledger-row studio-ledger-untouched"><span>Does not affect</span><strong>Current Continuity {continuityRevision}</strong><p>Current world facts, {currentRecord ? `${currentRecord} history, ` : ""}the playable harbor scene, and other paths stay as they are.</p></div>
      </div>
      <div className="studio-review-boundary"><span>Continuity boundary</span><strong>Proposal ≠ current world change</strong><p>Keeping this draft records an idea for later review only. It does not publish a revision, mutate a record, or rewrite history.</p></div>
      <div className="studio-review-actions"><button className="button-ghost" onClick={onBack}>Back to draft</button><button className="button-dark" onClick={onKeep}>Keep proposal as draft</button><button className="button-paper" onClick={onReturnWorld}>Return to playable world</button></div>
    </section>
  );
}

export default function WorldStudio({ currentRecord, beacon, maren, watchPledged, draft, onDraftChange, onReturnWorld }: WorldStudioProps) {
  const [panel, setPanel] = useState<StudioPanel>("draft");
  const [depthOpen, setDepthOpen] = useState(false);

  if (panel === "review") {
    return <main className="main-stage studio-stage"><div className="studio-stage-inner"><WorldFirstPanel currentRecord={currentRecord} beacon={beacon} maren={maren} watchPledged={watchPledged} draft={draft} onDraftChange={onDraftChange} onReturnWorld={onReturnWorld} /><RevisionReview currentRecord={currentRecord} onBack={() => setPanel("draft")} onKeep={() => { onDraftChange({ structureEnabled: true, kept: true }); setPanel("draft"); }} onReturnWorld={onReturnWorld} /></div></main>;
  }

  return (
    <main className="main-stage studio-stage">
      <div className="studio-stage-inner">
        <WorldFirstPanel currentRecord={currentRecord} beacon={beacon} maren={maren} watchPledged={watchPledged} draft={draft} onDraftChange={onDraftChange} onReturnWorld={onReturnWorld} />
        <section className="studio-rail" aria-labelledby="studio-title">
          <div className="studio-rail-heading">
            <div>
              <div className="studio-panel-kicker"><span className="eyebrow-dot" />World Studio</div>
              <h2 id="studio-title">Shape what could come next.</h2>
            </div>
            <span className="studio-draft-label">Local draft</span>
          </div>
          <p className="studio-rail-intro">The world stays playable while you add only the structure that earns its place.</p>
          {draft.kept && <div className="studio-draft-notice" role="status"><span className="studio-status-dot" /><strong>{proposedRevision} proposal kept in this prototype session · not applied</strong><small>It survives navigation and refresh in this open prototype tab. It is not a durable save, cloud sync, or published revision. Current Continuity remains {continuityRevision}.</small></div>}
          <StructureSection enabled={draft.structureEnabled} onToggle={() => onDraftChange({ structureEnabled: !draft.structureEnabled, kept: false })} onReview={() => setPanel("review")} />
          <OptionalDepth open={depthOpen} onToggle={() => setDepthOpen((value) => !value)} />
          <div className="studio-footnote"><span className="coordinate-dot" />Current Continuity is pinned to {continuityRevision}. Studio changes in this prototype are proposals only.</div>
        </section>
      </div>
    </main>
  );
}
