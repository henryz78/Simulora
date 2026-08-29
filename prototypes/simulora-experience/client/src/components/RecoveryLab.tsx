/**
 * Quiet Observatory — P3 Recovery Lab prototype only.
 * Design reminder: recovery begins with intent and preservation; it never impersonates destructive rewind or runtime persistence.
 */
import { useState, type ReactNode } from "react";

type RecoveryMode = "overview" | "safe-point" | "branch" | "restore" | "restore-confirm" | "restore-complete" | "stale" | "correction" | "delete";

type RecoveryLabProps = {
  currentRecord: string | null;
  history: string[];
  initialMode?: "overview" | "stale";
  onReturnWorld: () => void;
  onOpenLens: () => void;
};

function IntentCard({ number, title, copy, available = true, active, onClick }: { number: string; title: string; copy: string; available?: boolean; active: boolean; onClick: () => void }) {
  return <button className={`recovery-intent ${active ? "active" : ""} ${available ? "" : "unavailable"}`} onClick={onClick} disabled={!available}>
    <span className="recovery-intent-number">{number}</span><span><strong>{title}</strong><small>{copy}</small></span><span className="recovery-intent-arrow">→</span>
  </button>;
}

function PreservationNote({ children }: { children: ReactNode }) {
  return <div className="preservation-note"><span className="preservation-mark">◌</span><p>{children}</p></div>;
}

function recordSnapshot(record: string | null) {
  if (record === "C-118") return "Beacon lit · Maren waiting";
  if (record === "C-119") return "Beacon unlit · Maren watching";
  if (record) return "Beacon truth preserved · later watch instruction recorded";
  return "No recorded state";
}

export default function RecoveryLab({ currentRecord, history, initialMode = "overview", onReturnWorld, onOpenLens }: RecoveryLabProps) {
  const [mode, setMode] = useState<RecoveryMode>(initialMode === "stale" ? "stale" : "overview");
  const [safePointName, setSafePointName] = useState("Before the tide turns");
  const [safePointMarked, setSafePointMarked] = useState(false);
  const [branchName, setBranchName] = useState("Lantern watch — alternate path");
  const [branchPrepared, setBranchPrepared] = useState(false);
  const hasRecord = currentRecord !== null;
  const currentIndex = currentRecord ? history.lastIndexOf(currentRecord) : -1;
  const earlierRecord = currentIndex > 0 ? history[currentIndex - 1] : history.find((record) => record !== currentRecord) ?? null;
  const canRestore = Boolean(earlierRecord && currentRecord);
  const selectedMode = mode === "restore-confirm" || mode === "restore-complete" || mode === "stale" ? "restore" : mode;

  const showOverview = mode === "overview";
  const showSafePoint = mode === "safe-point";
  const showBranch = mode === "branch";
  const showRestore = mode === "restore";
  const showRestoreConfirm = mode === "restore-confirm";
  const showRestoreComplete = mode === "restore-complete";
  const showStale = mode === "stale";
  const showCorrection = mode === "correction";
  const showDelete = mode === "delete";

  return <main className="main-stage world-first-stage recovery-lab-stage"><div className="stage-inner recovery-stage-inner">
    <div className="breadcrumb"><span>Greyhaven</span><span>·</span><span>Harbor path</span><span>·</span><span>Recovery Lab</span></div>
    <div className="world-coordinate-bar"><span><i className="coordinate-dot" />Personal Branch 01</span><span>{currentRecord ? `Current record ${currentRecord}` : "No current record"}</span><button onClick={onReturnWorld}>Return to world</button></div>
    <div className="recovery-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />Recovery Lab</div><h1 className="stage-title">Protect the path before you change it.</h1><p className="stage-subtitle">Choose the kind of recovery you mean. Each path explains what stays safe before it asks you to continue.</p></div><div className="recovery-current"><i className="recovery-orbit" aria-hidden="true" /><span>Current path</span><strong>{currentRecord ? `Greyhaven · ${currentRecord}` : "Greyhaven · no recorded change"}</strong><small>{currentRecord ? "The current record remains your starting point." : "Only a recorded point can be used for recovery."}</small></div></div>
    <div className="recovery-signal-thread" aria-label="Recovery review path"><span><i />Current record</span><b /><span><i />Choose intent</span><b /><span><i />Review its boundary</span><b className="thread-tail" /></div>

    <section className="recovery-layout" aria-label="Recovery choices and review">
      <aside className="recovery-intents"><div className="recovery-intents-label">What do you need?</div>
        <IntentCard number="01" title="Mark a safe point" copy="Keep a reachable label for a recorded moment." available={hasRecord} active={selectedMode === "safe-point"} onClick={() => setMode("safe-point")} />
        <IntentCard number="02" title="Try another path" copy="Explore without changing the original." available={hasRecord} active={selectedMode === "branch"} onClick={() => setMode("branch")} />
        <IntentCard number="03" title="Restore this path" copy="Bring a reviewed earlier effect forward." available={canRestore} active={selectedMode === "restore"} onClick={() => setMode("restore")} />
        <IntentCard number="04" title="Correct a continuity item" copy="Change one named fact, not a timeline." available={hasRecord} active={selectedMode === "correction"} onClick={() => setMode("correction")} />
        <IntentCard number="05" title="Delete…" copy="Lifecycle work, never a recovery shortcut." active={selectedMode === "delete"} onClick={() => setMode("delete")} />
      </aside>

      <section className="recovery-workbench" aria-live="polite"><div className="recovery-document-meta"><span>Recovery file · Personal Branch 01</span><span>{currentRecord ? `Source · ${currentRecord}` : "Source · no record"}</span><span>Scope review required</span></div>
        {showOverview && <div className="recovery-empty"><div className="card-kicker">Start with intent</div><h2>There is more than one way to go back safely.</h2><p>{hasRecord ? "Your current record is available. Select the promise that matches what you want to protect or change." : "This path has no recorded recovery source yet. A future confirmed change can be labelled, branched from or reviewed for restoration."}</p><PreservationNote>{hasRecord ? <>Nothing here changes the current path until a future operation is reviewed and confirmed.</> : <>A draft or possible outcome is not a recovery point. Return to the world when you are ready to make a confirmed change.</>}</PreservationNote><button className="button-ghost" onClick={onReturnWorld}>Return to world</button></div>}

        {showSafePoint && <div className="recovery-flow"><div className="card-kicker">Safe point · current record {currentRecord}</div><h2>Name a place you may want to return to.</h2><p>A safe point is a readable label for this reachable recorded moment. It does not copy the world, create an alternative or remove later history.</p><label className="recovery-label">Safe-point name<input value={safePointName} onChange={(event) => setSafePointName(event.target.value)} /></label><PreservationNote>The current path stays exactly as it is. In a product, this label would reference the current recorded point rather than make a second state.</PreservationNote>{safePointMarked ? <div className="recovery-result"><span>Labelled in this prototype</span><strong>{safePointName || "Untitled safe point"}</strong><p>The recovery label is shown as a reference only; no world state was copied or changed.</p><button className="button-ghost" onClick={() => setMode("overview")}>Choose another recovery path</button></div> : <div className="recovery-actions"><button className="button-dark" onClick={() => setSafePointMarked(true)}>Mark this safe point</button><button className="button-ghost" onClick={() => setMode("overview")}>Cancel</button></div>}</div>}

        {showBranch && <div className="recovery-flow"><div className="card-kicker">Alternative Branch · from {currentRecord}</div><h2>Try the night crossing without changing today.</h2><p>This starts an alternative from the selected recorded point. Your original Greyhaven path remains unchanged, with its history intact.</p><label className="recovery-label">Name this experiment<input value={branchName} onChange={(event) => setBranchName(event.target.value)} /></label><div className="recovery-compare"><div><span>Original</span><strong>Personal Branch 01</strong><small>Stays at {currentRecord}.</small></div><div><span>Alternative</span><strong>{branchName || "Unnamed alternate path"}</strong><small>Would begin from {currentRecord}.</small></div></div><PreservationNote>There is no merge or replacement here. Later choices in the alternative would remain separate from the original.</PreservationNote>{branchPrepared ? <div className="recovery-result"><span>Alternative prepared in this prototype</span><strong>{branchName || "Unnamed alternate path"}</strong><p>The future product operation would create a separate Branch and a fork record. This static prototype has not created one.</p><button className="button-ghost" onClick={() => setMode("overview")}>Return to recovery choices</button></div> : <div className="recovery-actions"><button className="button-dark" onClick={() => setBranchPrepared(true)}>Create this alternative</button><button className="button-ghost" onClick={() => setMode("overview")}>Keep the original</button></div>}</div>}

        {showRestore && <div className="recovery-flow"><div className="card-kicker">Restore preview · earlier record {earlierRecord}</div><h2>Bring the earlier harbor state forward with care.</h2><p>This review compares the accessible earlier record with your current path. It is not a rewind: a future Restore would append a new transition here after a current-state check.</p><div className="restore-diff"><div className="restore-from"><span>Selected earlier record</span><strong>{earlierRecord}</strong><small>{recordSnapshot(earlierRecord)}</small></div><div className="restore-arrow">→</div><div className="restore-to"><span>Current path</span><strong>{currentRecord}</strong><small>{recordSnapshot(currentRecord)}</small></div></div><div className="scope-preview"><div><span>Affected here</span><p>The reviewed effects represented by {earlierRecord} in this Greyhaven path.</p></div><div><span>Preserved</span><p>{currentRecord}, {earlierRecord} and the rest of this path’s history remain available.</p></div><div><span>Not affected</span><p>Participation agreement, account access, consent, ownership, usage and other paths.</p></div></div><PreservationNote>You will review this exact scope again before the modeled confirmation. If the current path changed, the review would need to be renewed.</PreservationNote><div className="recovery-actions"><button className="button-dark" onClick={() => setMode("restore-confirm")}>Review restore effect</button><button className="button-ghost" onClick={() => setMode("overview")}>Back to recovery choices</button></div></div>}

        {showRestoreConfirm && <div className="recovery-flow recovery-confirm"><div className="eyebrow"><span className="eyebrow-dot" />Exact review required</div><h2>Confirm this scoped restore.</h2><p>You are reviewing the earlier effect from {earlierRecord} for Personal Branch 01. The original record and later history remain visible; this does not restore contracts, account access or other paths.</p><div className="exact-effect"><h3>What a future Restore would add</h3><ul><li>The reviewed world effects from {earlierRecord} would be brought forward on the current Greyhaven path.</li><li>Related current character expectations would be updated only where the selected record requires it.</li><li>A new transition would be appended; no history would be removed.</li></ul></div><div className="recovery-actions"><button className="button-dark" onClick={() => setMode("restore-complete")}>Confirm this restore</button><button className="button-ghost" onClick={() => setMode("restore")}>Keep current path</button></div></div>}

        {showRestoreComplete && <div className="recovery-flow"><div className="recovery-complete-mark">✓</div><div className="card-kicker">Prototype result · restore reviewed</div><h2>The original path would remain visible.</h2><p>This prototype has shown the post-confirmation message only. In a future product, the reviewed effect would be committed as a new transition on Personal Branch 01 after its current-head check.</p><div className="scope-preview"><div><span>Would change</span><p>Selected beacon and Maren state in this path.</p></div><div><span>Would remain</span><p>Earlier and later history, other paths, agreements and account-level boundaries.</p></div></div><button className="button-ghost" onClick={() => setMode("overview")}>Return to recovery choices</button></div>}

        {showStale && <div className="recovery-flow recovery-stale"><div className="card-kicker">Restore review expired</div><h2>This path changed before the review could be applied.</h2><p>The earlier preview no longer describes the same current context. Nothing was restored, changed or removed.</p><PreservationNote>Review the current path again before you choose an exact restore. The prototype does not select a new source or effect for you.</PreservationNote><div className="recovery-actions"><button className="button-dark" onClick={() => setMode("restore")}>Review current restore options</button><button className="button-ghost" onClick={() => setMode("overview")}>Keep current path</button></div></div>}

        {showCorrection && <div className="recovery-flow"><div className="card-kicker">Correction · one current item</div><h2>Correct a fact without creating another timeline.</h2><p>Correction is for a named current continuity item. It does not branch, restore a whole path or make a past record disappear.</p><div className="recovery-single-item"><span>Current item</span><strong>Greyhaven beacon · {currentRecord}</strong><small>Record-bound review shows the target, current scope, effect and preserved history.</small></div><PreservationNote>Use the Continuity Lens for the exact correction path. A future correction would still require the bound review and confirmation for the current state.</PreservationNote><div className="recovery-actions"><button className="button-dark" onClick={onOpenLens}>Review current beacon record</button><button className="button-ghost" onClick={() => setMode("overview")}>Back to recovery choices</button></div></div>}

        {showDelete && <div className="recovery-flow recovery-delete"><div className="card-kicker">Lifecycle boundary</div><h2>Delete is not a way to go back.</h2><p>Deletion has its own ownership, scope, retained-information and appeal meaning. It cannot be used to erase a Branch, hide an earlier record or replace a reviewed Restore.</p><PreservationNote>This P3 exploration intentionally does not simulate a destructive action. Returning to recovery choices leaves the current world untouched.</PreservationNote><button className="button-ghost" onClick={() => setMode("overview")}>Return to recovery choices</button></div>}
      </section>
    </section>
  </div></main>;
}
