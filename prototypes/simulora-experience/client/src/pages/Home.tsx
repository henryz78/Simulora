/**
 * Quiet Observatory — approved P1/P2/P3 baseline plus P4 World Studio exploration.
 * One prototype-level current-world truth drives every surface. This is static mock state, not product runtime or persistence.
 */
import { useEffect, useState } from "react";
import RecoveryLab from "@/components/RecoveryLab";
import WorldStudio from "@/components/WorldStudio";

type ActionStage = "ready" | "received" | "provisional" | "awaiting-confirmation" | "cancelled" | "interrupted" | "recorded";
type View = "action" | "return" | "recovery" | "studio";
type LensTarget = "beacon" | "maren" | "boat";
type RecordId = `C-${number}`;
type BeaconRecordId = "C-118" | "C-119";

type ActionSession = {
  cycle: number;
  stage: ActionStage;
  text: string;
  basedOn: RecordId | null;
  recordedId: RecordId | null;
};

type StudioDraftState = {
  structureEnabled: boolean;
  kept: boolean;
};

type NavigationState = {
  view: View;
  lensTarget: LensTarget | null;
  continuityOpen: boolean;
  contextOpen: boolean;
};

type PrototypeSession = {
  world: WorldTruth;
  action: ActionSession;
  studioDraft: StudioDraftState;
};

type WorldTruth = {
  beacon: "unlit" | "lit";
  maren: "watching" | "waiting";
  northboundBoat: "out";
  watchPledged: boolean;
  beaconRecord: BeaconRecordId | null;
  currentRecord: RecordId | null;
  history: RecordId[];
};

type LensContent = {
  title: string;
  kind: "record" | "empty";
  fact: string;
  explanation: string;
  matters: string;
  scope: string;
  freshness: string;
  source?: string;
  recordId?: string;
  correctionLabel?: string;
  history?: string;
};

const actionCopy = "Ask Maren to light the Greyhaven beacon before the tide turns.";
const followUpActionCopy = "Ask Maren to keep the north-water watch until the tide turns.";
const prototypeSessionKey = "simulora-overall-experience-session-v1";
const initialWorld: WorldTruth = { beacon: "unlit", maren: "watching", northboundBoat: "out", watchPledged: false, beaconRecord: null, currentRecord: null, history: [] };
const recordedWorld: WorldTruth = { beacon: "lit", maren: "waiting", northboundBoat: "out", watchPledged: false, beaconRecord: "C-118", currentRecord: "C-118", history: ["C-118"] };
const correctedWorld: WorldTruth = { beacon: "unlit", maren: "watching", northboundBoat: "out", watchPledged: false, beaconRecord: "C-119", currentRecord: "C-119", history: ["C-118", "C-119"] };

function worldNow(world: WorldTruth) {
  const watchCopy = world.watchPledged ? " She is also holding the north-water watch until the tide turns." : "";
  if (world.beaconRecord === "C-118") {
    return { title: "The beacon carries its light across the harbor.", subtitle: `Maren is waiting in the lamp room, because you confirmed the night crossing on this path.${watchCopy}`, scene: "The lamp room is bright. Maren has set the signal glass in the east window.", meta: "Maren nearby · northbound boat remains out · tide turns in 43 minutes", signal: world.watchPledged ? "The latest recorded instruction continues this world without replacing its earlier truth." : "One recorded choice now shapes this world." };
  }
  if (world.beaconRecord === "C-119") {
    return { title: "The harbor has returned to its watchful dark.", subtitle: `The beacon is unlit again on this path. Maren has stepped back from the lamp room after your correction.${watchCopy}`, scene: "The lamp room is dark again. The signal glass rests in its case while Maren watches the north water.", meta: "Maren nearby · northbound boat remains out · tide turns in 43 minutes", signal: world.watchPledged ? "The correction remains current while a later instruction continues the watch." : "A newer record now applies on this path." };
  }
  return { title: "The harbor waits for the tide to decide.", subtitle: "Maren keeps the beacon dark until she knows whether the northbound boats will return tonight.", scene: "The lamp room is empty. One storm bell waits behind the fogged glass.", meta: "Maren nearby · northbound boat remains out · tide turns in 43 minutes", signal: "A choice can change this world. It has not changed it yet." };
}

function recordSummary(world: WorldTruth) {
  if (world.currentRecord === "C-118") return { heading: "The Greyhaven beacon is now lit.", copy: "Maren is waiting at the lamp room. This confirmed change applies to your current path.", facts: ["Beacon lit tonight", "Maren is waiting", "This path only"] };
  if (world.currentRecord === "C-119") return { heading: "The Greyhaven beacon is now unlit.", copy: "Maren has stepped back from the lamp room. This newer correction applies to your current path; the earlier choice remains in history.", facts: ["Beacon unlit tonight", "Maren is watching", "Earlier choice kept in history"] };
  if (world.currentRecord) return { heading: "Maren is holding the north-water watch.", copy: `Your follow-up instruction was recorded as ${world.currentRecord}. It continues beside the existing beacon truth rather than replacing it.`, facts: ["North-water watch continues", `Recorded as ${world.currentRecord}`, "Earlier records remain in history"] };
  return null;
}

function lensContent(world: WorldTruth, target: LensTarget): LensContent {
  if (target === "beacon") {
    if (world.beaconRecord === "C-118") return { title: "Why is the beacon lit?", kind: "record", fact: "The Greyhaven beacon is lit.", explanation: "The lamp-room scene treats the beacon as visible because you confirmed the night crossing.", matters: "At the lamp room and in Maren’s current expectation.", scope: "Your Greyhaven path, not every version of Greyhaven.", freshness: world.currentRecord === "C-118" ? "Settled 12 minutes ago. No newer correction has changed it." : `C-118 still applies to the beacon; ${world.currentRecord} is a later, separate instruction.`, source: "User-confirmed world change", recordId: "Commit C-118", correctionLabel: "Correct this record" };
    if (world.beaconRecord === "C-119") return { title: "Why is the beacon unlit?", kind: "record", fact: "The Greyhaven beacon is unlit.", explanation: "The lamp-room scene is dark because you confirmed a newer correction to the beacon record.", matters: "At the lamp room and in Maren’s current expectation.", scope: "Your Greyhaven path, not every version of Greyhaven.", freshness: world.currentRecord === "C-119" ? "Settled just now. This is the newest beacon record that applies." : `C-119 remains the newest beacon record; ${world.currentRecord} is a later, separate instruction.`, source: "User-confirmed correction", recordId: "Commit C-119", correctionLabel: "Review this correction", history: "Commit C-118 remains in history as an earlier, superseded choice." };
    return { title: "Is there a beacon record?", kind: "empty", fact: "No recorded beacon change yet.", explanation: "The beacon is currently unlit. That is the active world situation, but no confirmed action record has been made for it on this path.", matters: "The lamp room is still dark and Maren is still watching the north water.", scope: "Your Greyhaven path.", freshness: "No beacon record exists to review or correct." };
  }
  if (target === "maren") {
    if (world.watchPledged && world.currentRecord) return { title: "Why is Maren holding the watch?", kind: "record", fact: "Maren is holding the north-water watch until the tide turns.", explanation: "This follows your latest recorded instruction without changing the beacon decision that already applies.", matters: "At the east breakwater and during the current tide watch.", scope: "Your Greyhaven path, not every version of Greyhaven.", freshness: `${world.currentRecord} is the latest record on this path.`, source: "User-confirmed follow-up action", recordId: `Commit ${world.currentRecord}`, history: `${world.beaconRecord ?? "The baseline"} continues to govern the beacon; the follow-up did not replace it.` };
    if (world.beaconRecord === "C-118") return { title: "Why is Maren waiting?", kind: "record", fact: "Maren is waiting in the lamp room.", explanation: "Her present expectation follows the confirmed beacon decision on this path.", matters: "In the lamp room, and whenever the night crossing is discussed.", scope: "Your Greyhaven path, not every version of Greyhaven.", freshness: "Her expectation was settled with the beacon change 12 minutes ago.", source: "Effect of the beacon record", recordId: "Commit C-118", correctionLabel: "Correct the beacon record behind this" };
    if (world.beaconRecord === "C-119") return { title: "Why has Maren stepped back?", kind: "record", fact: "Maren is watching the dark beacon from the breakwater.", explanation: "Her present situation follows the newer beacon correction on this path.", matters: "At the east breakwater and in the lamp-room scene.", scope: "Your Greyhaven path, not every version of Greyhaven.", freshness: "Her situation was updated by the newest beacon record.", source: "Effect of the beacon correction", recordId: "Commit C-119", correctionLabel: "Review the beacon correction", history: "Maren’s earlier lamp-room expectation remains linked to C-118 in history." };
    return { title: "Why is Maren watching?", kind: "empty", fact: "Maren is watching the dark beacon.", explanation: "No confirmed beacon change has altered her current situation on this path.", matters: "At the east breakwater and in the first lamp-room scene.", scope: "Your Greyhaven path.", freshness: "There is no related recorded change to review or correct." };
  }
  return { title: "Why has the boat not returned?", kind: "record", fact: "The northbound boat has not returned.", explanation: "The harbor has noticed the delay. It is a current observation, not a consequence of the beacon decision.", matters: "In the harbor’s current situation and the tide-watch conversation.", scope: "Your Greyhaven path.", freshness: "Observed during the current tide watch.", source: "Observed harbor event", recordId: "Observation E-204", history: "This prototype does not offer correction for this observed event." };
}

function ChangeTracePanel({ world, action, onClose }: { world: WorldTruth; action: ActionSession; onClose: () => void }) {
  const pending = action.stage !== "ready" && action.stage !== "recorded";
  const originalActionSuperseded = world.beaconRecord === "C-119";
  const record = recordSummary(world);
  const stageCopy = action.stage === "interrupted"
    ? "The check did not complete. Nothing new was recorded."
    : action.stage === "cancelled"
      ? "Direct confirmation was cancelled. The proposal is still visible, and the world is unchanged."
      : action.stage === "awaiting-confirmation"
        ? "The exact effect is awaiting your direct confirmation."
        : "A possible outcome remains separate from the world record.";
  return <aside className="context-overlay" aria-label="Action record"><section className="context-panel"><div className="lens-topline"><div><div className="eyebrow"><span className="eyebrow-dot" />Action record</div><h2 className="lens-title">What has happened so far</h2></div><button className="button-small" onClick={onClose}>Close</button></div><p className="lens-intro">This separates the current or latest action from earlier history. A possible outcome never becomes world truth by appearing here.</p><div className="trace-detail">{originalActionSuperseded && <div className="trace-line"><div className="trace-time">Earlier action · history</div><div className="trace-title">Ask Maren to light the beacon</div><div className="trace-copy">Originally received on this path; its C-118 result was later superseded by the C-119 correction. It is not the current action.</div></div>}{(pending || action.stage === "recorded") && <div className={`trace-line ${pending ? "active" : ""}`}><div className="trace-time">{action.stage === "recorded" ? "Latest completed action" : "Current action"}</div><div className="trace-title">{action.text}</div><div className="trace-copy">{action.stage === "recorded" ? `Recorded as ${action.recordedId}.` : `Received against ${action.basedOn ?? "the initial world state"}; no newer world change has been recorded from it.`}</div></div>}{pending && <div className="trace-line active"><div className="trace-time">World check</div><div className="trace-title">Possible impact considered</div><div className="trace-copy">{stageCopy}</div></div>}{record && <div className="trace-line committed"><div className="trace-time">Latest world record</div><div className="trace-title">{record.heading}</div><div className="trace-copy">{world.beaconRecord === "C-119" ? `C-119 still governs the beacon${world.currentRecord !== "C-119" ? `; ${world.currentRecord} is a later, separate instruction` : ""}. C-118 remains in history.` : "Direct confirmation made this outcome part of the current world record."}</div></div>}</div><div className="last-record"><div className="record-title"><span className="record-dot" />Current supporting observation</div><div className="record-meta">The northbound boat remains out. That observation is unchanged by the beacon record.</div></div></section></aside>;
}

function WorldContextSheet({ world, action, onClose, onOpenStudio, onOpenRecovery }: { world: WorldTruth; action: ActionSession; onClose: () => void; onOpenStudio: () => void; onOpenRecovery: () => void }) {
  const state = worldNow(world);
  const pending = action.stage !== "ready" && action.stage !== "recorded";
  return <aside className="context-overlay" aria-label="World context"><section className="context-panel"><div className="lens-topline"><div><div className="eyebrow"><span className="eyebrow-dot" />World context</div><h2 className="lens-title">Greyhaven, your current path</h2></div><button className="button-small" onClick={onClose}>Close</button></div><p className="lens-intro">Use this surface when you need orientation or a deliberate way into deeper world work. It stays secondary while the playable world remains primary.</p><div className="context-section"><div className="card-kicker">Where you are</div><p className="context-statement">Day 18, dusk · Harbor path</p><p className="context-copy">You are looking at Personal Branch 01. {state.signal} Changes shown in this prototype stay on this path.</p></div><div className="context-section"><div className="card-kicker">How this world responds</div><p className="context-statement">Shared initiative, open structure</p><p className="context-copy">The world may introduce meaningful possibilities; you retain the authority to decide high-impact outcomes. An ordinary action cannot change this agreement.</p></div><div className="context-section"><div className="card-kicker">What is true now</div><p className="context-statement">{world.beacon === "lit" ? "The beacon is lit; Maren is waiting." : "The beacon is unlit; Maren is watching."}</p><p className="context-copy">{world.currentRecord ? `${world.currentRecord} is the latest record. The beacon is governed by ${world.beaconRecord ?? "the baseline"}; use a fact Lens for the exact source and history.` : "No confirmed beacon change exists yet. A future confirmed action can create a record; a proposal cannot."}</p></div>{pending && <div className="context-section context-pending"><div className="card-kicker">Action still in progress</div><p className="context-statement">{action.stage === "received" ? "Received · world unchanged" : action.stage === "interrupted" ? "Interrupted · nothing recorded" : "Proposal · not recorded"}</p><p className="context-copy">Leaving the World surface has not cleared this action. Return to World to continue, confirm, retry, or discard it.</p></div>}<div className="context-section context-destinations"><div className="card-kicker">Go deeper when you choose</div><button className="context-destination" onClick={onOpenStudio}><span><strong>Shape what could come next</strong><small>Open World Studio beside the current playable world.</small></span><b>World Studio →</b></button><button className="context-destination" onClick={onOpenRecovery}><span><strong>Protect or revisit this path</strong><small>Open Recovery Lab without erasing the original.</small></span><b>Recovery Lab →</b></button></div></section></aside>;
}

function ActionStatus({ stage, onAdvance, onReset }: { stage: "received" | "interrupted"; onAdvance: () => void; onReset: () => void }) {
  if (stage === "received") return <section className="status-panel" aria-live="polite"><div className="status-row"><span className="status-indicator" />Your action is received. The world is still unchanged.</div><p>We are checking the possible effect on Maren and the harbor route. You may safely visit Continuity, Recovery, or Studio and return to this same status.</p><div className="status-actions"><button className="button-small" onClick={onAdvance}>See what could change</button><button className="button-small" onClick={onReset}>Keep world unchanged</button></div></section>;
  return <section className="status-panel interrupted" aria-live="assertive"><div className="status-row"><span className="status-indicator" />We could not finish the check. Your world is unchanged.</div><p>No proposal was recorded. You can safely retry from the same world state or leave this action behind.</p><div className="status-actions"><button className="button-small" onClick={onAdvance}>Retry safely</button><button className="button-small" onClick={onReset}>Discard this action</button></div></section>;
}

function nextFollowUpRecord(world: WorldTruth): RecordId {
  const highest = world.history.reduce((value, record) => Math.max(value, Number(record.slice(2)) || 0), 0);
  return `C-${Math.max(120, highest + 1)}`;
}

function P1Action({ world, setWorld, action, setAction, onOpenLens, onOpenContext, onOpenStudio }: { world: WorldTruth; setWorld: (world: WorldTruth) => void; action: ActionSession; setAction: (action: ActionSession) => void; onOpenLens: (target: LensTarget) => void; onOpenContext: () => void; onOpenStudio: () => void }) {
  const [traceOpen, setTraceOpen] = useState(false);
  const current = worldNow(world);
  const recorded = recordSummary(world);
  const initialBeaconAction = action.basedOn === null && world.beaconRecord === null;
  const proposalVisible = action.stage === "provisional" || action.stage === "cancelled" || action.stage === "awaiting-confirmation";
  const resetAction = () => setAction({ ...action, stage: "ready", text: action.basedOn ? followUpActionCopy : actionCopy, recordedId: null });
  const beginNextAction = () => setAction({ cycle: action.cycle + 1, stage: "ready", text: followUpActionCopy, basedOn: world.currentRecord, recordedId: null });
  const confirmAction = () => {
    if (initialBeaconAction) {
      setWorld(recordedWorld);
      setAction({ ...action, stage: "recorded", recordedId: "C-118" });
      return;
    }
    const recordId = nextFollowUpRecord(world);
    setWorld({ ...world, watchPledged: true, currentRecord: recordId, history: [...world.history, recordId] });
    setAction({ ...action, stage: "recorded", recordedId: recordId });
  };
  const proposalTitle = initialBeaconAction ? "The lamp could be lit tonight." : "Maren could hold the north-water watch.";
  const proposalCopy = initialBeaconAction ? "“Maren takes the signal glass from its case and watches the north water for your answer.”" : "“Maren folds the tide chart beside her and agrees to keep watch until the turn.”";
  const effects = initialBeaconAction
    ? ["The beacon will be lit tonight in your Greyhaven path.", "Maren will understand that you endorsed the night crossing.", "Other paths and the west pier closure will stay as they are."]
    : ["Maren will hold the north-water watch until the tide turns on this path.", "The current beacon decision will remain exactly as it is.", "Earlier records and other paths will remain available and unchanged."];

  return <main className="main-stage world-first-stage"><div className="stage-inner"><div className="breadcrumb"><span>Greyhaven</span><span>·</span><span>Harbor path</span><span>·</span><span>Day 18, dusk</span></div><div className="world-coordinate-bar"><span><i className="coordinate-dot" />Personal Branch 01</span><span>Harbor path</span><button onClick={onOpenContext}>World context</button></div><div className="eyebrow"><span className="eyebrow-dot" />World now</div><h1 className="stage-title">{current.title}</h1><p className="stage-subtitle">{current.subtitle}</p><div className="signal-thread"><span className="signal-dot" />{current.signal}</div><section className={`scene-card ${world.beacon === "lit" ? "scene-lit" : ""}`} aria-label="Current scene"><div className="scene-location">Greyhaven · East breakwater</div><p className="scene-copy">{current.scene}</p><div className="scene-meta">{current.meta}</div></section><div className="support-strip"><span>{action.stage === "ready" ? world.currentRecord ? `${world.currentRecord} is current; the world is ready for your next action.` : "No new world record is waiting." : action.stage === "recorded" ? `${action.recordedId} was recorded; the world can continue.` : "One action is being considered; current world truth is unchanged."}</span><div className="support-actions"><button onClick={onOpenStudio}>Shape this world</button><button onClick={() => setTraceOpen(true)}>View action record</button></div></div>
    {(action.stage === "ready" || action.stage === "received") && <section className="action-card" aria-label="Action composer"><div className="action-card-top"><span className="card-kicker">Field note · your next step</span><span className="authoritative-label">World unchanged by this action</span></div><div className="record-thread"><span className="record-thread-node" /><span>{action.basedOn ? `Continues from ${action.basedOn}` : "From your present position"}</span></div><textarea className="action-textarea" value={action.text} disabled={action.stage === "received"} onChange={(event) => setAction({ ...action, text: event.target.value })} aria-label="Describe an action" /><div className="action-row"><span className="helper-text">Your action is received before it is considered. A response or draft is never a world record.</span><div className="composer-actions"><button className="button-paper" disabled={action.stage === "received"} onClick={() => action.text.trim() && setAction({ ...action, stage: "received", basedOn: world.currentRecord })}>{action.stage === "ready" ? "Send action" : "Action received"}</button></div></div></section>}
    {action.stage === "received" && <ActionStatus stage="received" onAdvance={() => setAction({ ...action, stage: "provisional" })} onReset={resetAction} />}
    {action.stage === "interrupted" && <ActionStatus stage="interrupted" onAdvance={() => setAction({ ...action, stage: "received" })} onReset={resetAction} />}
    {proposalVisible && <section className="proposal-card" aria-live="polite">{action.stage === "cancelled" && <div className="proposal-cancelled-note" role="status">Confirmation cancelled · proposal retained · world unchanged</div>}<div className="proposal-head"><div><div className="card-kicker">Possible outcome · your current path</div><h2 className="proposal-title">{proposalTitle}</h2></div><span className="proposal-status">Not recorded</span></div><div className="record-thread"><span className="record-thread-node" /><span>Possible consequence, not a world record</span></div><p className="provisional-copy">{proposalCopy}</p><ul className="effect-list">{effects.map((effect, index) => <li key={effect}><span className="effect-bullet">0{index + 1}</span><span>{effect}</span></li>)}</ul><div className="proposal-actions"><button className="button-ghost" onClick={resetAction}>Reject — keep world unchanged</button><button className="button-dark" onClick={() => setAction({ ...action, stage: "awaiting-confirmation" })}>Review this change</button></div></section>}
    {action.stage === "recorded" && recorded && <section className="commit-card" aria-live="polite"><div className="commit-bar" /><div className="commit-body"><div className="eyebrow"><span className="eyebrow-dot" />Recorded on your current path</div><h2 className="commit-title">{recorded.heading}</h2><div className="record-thread"><span className="record-thread-node" /><span>{action.recordedId === "C-119" ? "From your correction to the current beacon record" : "From your confirmation to the latest world record"}</span></div><p className="commit-copy">{recorded.copy}</p><div className="commit-facts">{recorded.facts.map((fact) => <span className="commit-fact" key={fact}>{fact}</span>)}</div><div className="proposal-actions" style={{ marginTop: 18 }}><button className="button-dark" onClick={beginNextAction}>Take another action</button><button className="button-ghost" onClick={() => onOpenLens(action.recordedId === "C-119" || action.recordedId === "C-118" ? "beacon" : "maren")}>Understand this record</button><button className="button-ghost" onClick={() => setTraceOpen(true)}>View action record</button></div></div></section>}
  </div>{traceOpen && <ChangeTracePanel world={world} action={action} onClose={() => setTraceOpen(false)} />}{action.stage === "awaiting-confirmation" && <ConfirmationDialog title="Confirm this world change" description={initialBeaconAction ? "You asked Maren to light Greyhaven’s beacon before the tide turns. Confirm only if this is the outcome you want your current path to record." : "You asked Maren to continue the north-water watch. The existing beacon truth will stay as it is."} effects={effects} confirmLabel="Confirm and record change" onCancel={() => setAction({ ...action, stage: "cancelled" })} onConfirm={confirmAction} />}</main>;
}

function ReturnChange({ number, title, copy, target, onOpen }: { number: string; title: string; copy: string; target: LensTarget; onOpen: (target: LensTarget) => void }) {
  return <button className="change-row change-link" onClick={() => onOpen(target)}><span className="change-symbol">{number}</span><span><span className="change-title">{title}</span><span className="change-copy">{copy}</span><span className="change-understand">Understand this change →</span></span></button>;
}

function P2Return({ world, onOpenLens, onOpenContext, onEnterWorld }: { world: WorldTruth; onOpenLens: (target: LensTarget) => void; onOpenContext: () => void; onEnterWorld: () => void }) {
  const hasReturnRecords = world.currentRecord !== null;
  const corrected = world.beaconRecord === "C-119";
  return <main className="main-stage world-first-stage"><div className="stage-inner return-view"><div className="breadcrumb"><span>Your worlds</span><span>·</span><span>Greyhaven</span><span>·</span><span>{hasReturnRecords ? "Returning after 8 days" : "Current path"}</span></div><div className="world-coordinate-bar"><span><i className="coordinate-dot" />Personal Branch 01</span><span>{hasReturnRecords ? "Three meaningful changes" : "No recorded change yet"}</span><button onClick={onOpenContext}>World context</button></div><section className="return-hero"><div className="eyebrow"><span className="eyebrow-dot" />{hasReturnRecords ? "Welcome back to Greyhaven" : "Greyhaven, as it is now"}</div><h1 className="stage-title">{hasReturnRecords ? "The coast kept moving while you were away." : "Begin with the harbor as it stands."}</h1><p className="stage-subtitle">{hasReturnRecords ? "Here is the smallest useful account of what changed in the world you chose to keep." : "No confirmed beacon change exists on this path yet. The world is waiting for your next step."}</p></section><div className="return-grid"><section className="return-card">{hasReturnRecords ? <><div className="card-kicker">Since your last visit · 3 meaningful changes</div><h2>Start with what matters.</h2><ReturnChange number="01" title={corrected ? "The Greyhaven beacon is unlit" : "The Greyhaven beacon is lit"} copy={corrected ? "You confirmed a newer correction. This is what now applies to the beacon on your current path." : "You confirmed the night crossing before the tide turned. This now applies to your current path."} target="beacon" onOpen={onOpenLens} /><ReturnChange number="02" title={world.watchPledged ? "Maren is holding the north-water watch" : corrected ? "Maren has stepped back from the lamp room" : "Maren is waiting at the lamp room"} copy={world.watchPledged ? `${world.currentRecord} records your follow-up instruction; the existing beacon truth still applies separately.` : corrected ? "Her current situation follows the newest beacon record." : "She now expects a night crossing because of the beacon record."} target="maren" onOpen={onOpenLens} /><ReturnChange number="03" title="The northbound boat has not returned" copy="The harbor has noticed the delay. It is a current observation, separate from the beacon record." target="boat" onOpen={onOpenLens} /><div className="orientation-action"><button className="button-ghost" onClick={() => onOpenLens(world.watchPledged ? "maren" : "beacon")}>Understand the main change</button><button className="button-dark" onClick={onEnterWorld}>Continue at the lamp room</button></div></> : <div className="return-empty"><div className="card-kicker">No confirmed change to resume</div><h2>The beacon is still unlit.</h2><p>There is no recorded beacon decision on this path. Maren remains at the breakwater, watching the north water.</p><div className="orientation-action"><button className="button-ghost" onClick={() => onOpenLens("beacon")}>Check the beacon record</button><button className="button-dark" onClick={onEnterWorld}>Enter world as it is</button></div></div>}</section><section className="return-card image-card"><div className="image-card-copy"><div className="card-kicker" style={{ color: "#f4cf78" }}>A safe next step</div><p>{world.watchPledged ? "Maren is keeping the watch. You can continue from the current world without reopening every past record." : hasReturnRecords && !corrected ? "Maren is at the lamp room. You can continue there without reopening every past record." : "The east breakwater is quiet. You can continue without reopening every past record."}</p></div></section></div></div></main>;
}

function ConfirmationDialog({ title, description, effects, confirmLabel, onConfirm, onCancel }: { title: string; description: string; effects: string[]; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="dialog-backdrop" role="presentation"><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><div className="eyebrow"><span className="eyebrow-dot" />Direct confirmation required</div><h2 className="dialog-title" id="confirmation-title">{title}</h2><p className="dialog-copy">{description}</p><div className="exact-effect"><h3>What will change if you continue</h3><ul>{effects.map((effect) => <li key={effect}>{effect}</li>)}</ul></div><p className="scope-guard">You are confirming this exact result. Cancelling leaves the current world record unchanged.</p><div className="dialog-actions"><button className="button-ghost" onClick={onCancel}>Cancel — keep world unchanged</button><button className="button-dark" onClick={onConfirm}>{confirmLabel}</button></div></section></div>;
}

function ContinuityOverview({ world, onOpenLens, onClose }: { world: WorldTruth; onOpenLens: (target: LensTarget) => void; onClose: () => void }) {
  const current = worldNow(world);
  return <aside className="lens-overlay" aria-label="Continuity"><section className="lens-panel continuity-overview"><div className="lens-topline"><div><div className="eyebrow"><span className="eyebrow-dot" />Continuity</div><h2 className="lens-title">What currently holds in Greyhaven</h2></div><button className="button-small" onClick={onClose}>Close</button></div><p className="lens-intro">Start with the current path, then choose a fact when you need its source, scope, freshness, or correction path. Continuity is not one beacon record.</p><article className="continuity-current-card"><span className="fact-badge">Current path</span><strong>{current.title}</strong><p>{world.currentRecord ? `${world.currentRecord} is the latest record on this path.` : "No confirmed change has been recorded yet."} Possible outcomes and Studio drafts are not included here.</p></article><div className="continuity-fact-list"><button className="change-row change-link" onClick={() => onOpenLens("beacon")}><span className="change-symbol">01</span><span><span className="change-title">Beacon · {world.beacon === "lit" ? "lit" : "unlit"}</span><span className="change-copy">Inspect the beacon fact and the record that currently governs it.</span><span className="change-understand">Open fact lens →</span></span></button><button className="change-row change-link" onClick={() => onOpenLens("maren")}><span className="change-symbol">02</span><span><span className="change-title">Maren · {world.watchPledged ? "holding the watch" : world.maren}</span><span className="change-copy">Understand her current situation and its relationship to the world record.</span><span className="change-understand">Open fact lens →</span></span></button><button className="change-row change-link" onClick={() => onOpenLens("boat")}><span className="change-symbol">03</span><span><span className="change-title">Northbound boat · still out</span><span className="change-copy">Review the supporting observation separately from user-confirmed changes.</span><span className="change-understand">Open fact lens →</span></span></button></div><div className="lens-actions"><button className="button-ghost" onClick={onClose}>Close Continuity</button></div></section></aside>;
}

function ContinuityLens({ world, onCorrect, target, returnLabel, onClose }: { world: WorldTruth; onCorrect: () => void; target: LensTarget; returnLabel: string; onClose: () => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const content = lensContent(world, target);
  const canCorrect = content.kind === "record" && target !== "boat" && world.beaconRecord !== "C-119";
  return <><aside className="lens-overlay" aria-label="Continuity lens"><section className="lens-panel"><div className="lens-topline"><div><div className="eyebrow"><span className="eyebrow-dot" />Continuity lens</div><h2 className="lens-title">{content.title}</h2></div><button className="button-small" onClick={onClose}>Close</button></div><p className="lens-intro">This is the short explanation for the change you selected. It shows what currently applies and why.</p><article className={`fact-card ${content.kind === "empty" ? "empty-fact" : ""}`}><div className="fact-card-head"><span className="fact-badge">{content.kind === "record" ? "Current world record" : "No record to review"}</span><p className="fact-statement">{content.fact}</p><p className="fact-plain-copy">{content.explanation}</p></div><div className="fact-grid"><div className="fact-row"><div className="fact-key">Where it matters</div><div className="fact-value">{content.matters}</div></div><div className="fact-row"><div className="fact-key">Where it belongs</div><div className="fact-value">{content.scope}</div></div><div className="fact-row"><div className="fact-key">Last settled</div><div className="fact-value">{content.freshness}</div></div></div></article><div className="source-safe"><strong>Helpful boundary:</strong> this explanation does not expose private context, raw prompts, hidden retrieval or model-only reasoning.</div>{content.kind === "record" && <><button className="details-disclosure" onClick={() => setDetailsOpen((open) => !open)}>{detailsOpen ? "Hide record details" : "View record details"}<span>{detailsOpen ? "−" : "+"}</span></button>{detailsOpen && <section className="technical-details" aria-live="polite"><div className="card-kicker">Record details</div><div className="fact-row"><div className="fact-key">Record kind</div><div className="fact-value">{target === "boat" ? "Current observation" : "Canonical fact"}</div></div><div className="fact-row"><div className="fact-key">Source</div><div className="fact-value">{content.source}</div></div><div className="fact-row"><div className="fact-key">Record ID</div><div className="fact-value">{content.recordId}</div></div><div className="fact-row"><div className="fact-key">Permitted scope</div><div className="fact-value">{content.scope}</div></div>{content.history && <div className="fact-row"><div className="fact-key">History</div><div className="fact-value">{content.history}</div></div>}</section>}</>}{content.kind === "empty" && <div className="empty-record-note">There is nothing to correct here yet. A possible outcome would still not create a record; only a confirmed change can do that.</div>}<div className="lens-actions">{canCorrect && <button className="button-dark" onClick={() => setCorrectionOpen(true)}>{content.correctionLabel}</button>}<button className="button-ghost" onClick={onClose}>{returnLabel}</button></div></section></aside>{correctionOpen && <ConfirmationDialog title="Correct the beacon record" description="This changes the current Greyhaven record on your path. The earlier choice remains in history, together with the reason this newer correction now applies." effects={["The beacon will be treated as unlit on this path.", "Maren’s current lamp-room expectation will be updated here.", "Other paths and the west pier closure will stay as they are."]} confirmLabel="Confirm correction" onCancel={() => setCorrectionOpen(false)} onConfirm={() => { setCorrectionOpen(false); onCorrect(); }} />}</>;
}

function MobileNav({ active, onWorld, onContinuity, onMore }: { active: "World" | "Continuity" | "More"; onWorld: () => void; onContinuity: () => void; onMore: () => void }) {
  return <nav className="mobile-bottom-nav" aria-label="Primary world navigation"><button className={active === "World" ? "active" : ""} onClick={onWorld}>World</button><button className={active === "Continuity" ? "active" : ""} onClick={onContinuity}>Continuity</button><button className={active === "More" ? "active" : ""} onClick={onMore}>More</button></nav>;
}

function readNavigation(): NavigationState {
  const params = new URLSearchParams(window.location.search);
  const slice = params.get("slice");
  const view: View = slice === "return" || slice === "recovery" || slice === "studio" ? slice : "action";
  const lens = params.get("lens");
  const lensTarget: LensTarget | null = lens === "beacon" || lens === "maren" || lens === "boat" ? lens : null;
  return { view, lensTarget, continuityOpen: params.get("continuity") === "1", contextOpen: params.get("context") === "1" && !lensTarget };
}

function navigationUrl(navigation: NavigationState) {
  const url = new URL(window.location.href);
  if (navigation.view === "action") url.searchParams.delete("slice");
  else url.searchParams.set("slice", navigation.view);
  if (navigation.lensTarget) url.searchParams.set("lens", navigation.lensTarget);
  else url.searchParams.delete("lens");
  if (navigation.continuityOpen) url.searchParams.set("continuity", "1");
  else url.searchParams.delete("continuity");
  if (navigation.contextOpen) url.searchParams.set("context", "1");
  else url.searchParams.delete("context");
  if (navigation.view !== "recovery") url.searchParams.delete("recovery");
  url.searchParams.delete("stage");
  return `${url.pathname}${url.search}${url.hash}`;
}

function loadPrototypeSession(fallback: PrototypeSession, forceFixture: boolean): PrototypeSession {
  if (forceFixture) return fallback;
  try {
    const raw = window.sessionStorage.getItem(prototypeSessionKey);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<PrototypeSession>;
    if (!stored.world || !stored.action || !stored.studioDraft) return fallback;
    return stored as PrototypeSession;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const preview = new URLSearchParams(window.location.search);
  const fixture = preview.get("fixture");
  const initialFixture = fixture === "recorded" ? recordedWorld : fixture === "corrected" ? correctedWorld : initialWorld;
  const suppliedStage = preview.get("stage");
  const fixtureAction: ActionSession = fixture === "recorded"
    ? { cycle: 1, stage: "recorded", text: actionCopy, basedOn: null, recordedId: "C-118" }
    : fixture === "corrected"
      ? { cycle: 2, stage: "recorded", text: "Correct the Greyhaven beacon record.", basedOn: "C-118", recordedId: "C-119" }
      : { cycle: 1, stage: suppliedStage === "acknowledged" ? "received" : suppliedStage === "proposal" ? "provisional" : suppliedStage === "interrupted" ? "interrupted" : "ready", text: actionCopy, basedOn: null, recordedId: null };
  const initialSession = loadPrototypeSession({ world: initialFixture, action: fixtureAction, studioDraft: { structureEnabled: false, kept: false } }, Boolean(fixture || suppliedStage));
  const [navigation, setNavigation] = useState<NavigationState>(readNavigation);
  const [world, setWorld] = useState<WorldTruth>(initialSession.world);
  const [action, setAction] = useState<ActionSession>(initialSession.action);
  const [studioDraft, setStudioDraft] = useState<StudioDraftState>(initialSession.studioDraft);

  useEffect(() => {
    const currentState = window.history.state as { simulora?: boolean; depth?: number } | null;
    if (!currentState?.simulora) window.history.replaceState({ simulora: true, depth: 0 }, "", window.location.href);
    const onPopState = () => setNavigation(readNavigation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(prototypeSessionKey, JSON.stringify({ world, action, studioDraft } satisfies PrototypeSession));
  }, [world, action, studioDraft]);

  const navigate = (next: NavigationState, replace = false) => {
    const state = window.history.state as { simulora?: boolean; depth?: number } | null;
    const currentDepth = state?.simulora ? state.depth ?? 0 : 0;
    const depth = replace ? currentDepth : currentDepth + 1;
    window.history[replace ? "replaceState" : "pushState"]({ simulora: true, depth }, "", navigationUrl(next));
    setNavigation(next);
  };
  const blankNavigation = (view: View): NavigationState => ({ view, lensTarget: null, continuityOpen: false, contextOpen: false });
  const returnToWorld = () => {
    const state = window.history.state as { simulora?: boolean; depth?: number } | null;
    if (state?.simulora && (state.depth ?? 0) > 0) window.history.go(-(state.depth ?? 0));
    else navigate(blankNavigation("action"), true);
  };
  const closeOverlay = () => {
    const state = window.history.state as { simulora?: boolean; depth?: number } | null;
    if (state?.simulora && (state.depth ?? 0) > 0) window.history.back();
    else navigate(blankNavigation(navigation.view), true);
  };
  const openSurface = (view: View) => navigate(blankNavigation(view), navigation.contextOpen);
  const openWorld = returnToWorld;
  const openReturn = () => openSurface("return");
  const openRecovery = () => openSurface("recovery");
  const openStudio = () => openSurface("studio");
  const openLens = (target: LensTarget) => navigate({ view: navigation.view, lensTarget: target, continuityOpen: navigation.continuityOpen, contextOpen: false });
  const openContinuity = () => navigate({ view: navigation.view, lensTarget: null, continuityOpen: true, contextOpen: false });
  const openContext = () => navigate({ view: navigation.view, lensTarget: null, continuityOpen: false, contextOpen: true });
  const applyCorrection = () => {
    const history: RecordId[] = world.history.includes("C-119") ? world.history : [...world.history, "C-119"];
    setWorld({ ...world, beacon: "unlit", maren: "watching", beaconRecord: "C-119", currentRecord: "C-119", history });
    setAction({ cycle: action.cycle + 1, stage: "recorded", text: "Correct the Greyhaven beacon record.", basedOn: world.currentRecord, recordedId: "C-119" });
  };
  const pending = action.stage !== "ready" && action.stage !== "recorded";
  const pendingLabel = action.stage === "received" ? "Received · world unchanged" : action.stage === "interrupted" ? "Interrupted · nothing recorded" : action.stage === "awaiting-confirmation" ? "Awaiting your confirmation" : "Proposal · not recorded";
  const activeMobile = navigation.contextOpen ? "More" : navigation.continuityOpen || navigation.lensTarget ? "Continuity" : "World";

  return <div className={`prototype-shell ${navigation.view === "recovery" ? "recovery-active" : ""}`}><header className="app-header"><div className="brand-lockup"><img className="brand-mark" src="/manus-storage/simulora-orbit-mark_09d38538.png" alt="Simulora orbit mark" /><span className="brand-name">Simulora</span><span className="prototype-tag">Prototype exploration</span></div><nav className="slice-tabs" aria-label="Prototype observation slices"><button className={`slice-tab ${navigation.view === "action" ? "active" : ""}`} onClick={openWorld}><span className="slice-index">OBS 01</span>Action truth</button><button className={`slice-tab ${navigation.view === "return" ? "active" : ""}`} onClick={openReturn}><span className="slice-index">OBS 02</span>Return & continuity</button><button className={`slice-tab ${navigation.view === "recovery" ? "active" : ""}`} onClick={openRecovery}><span className="slice-index">OBS 03</span>Recovery lab</button><button className={`slice-tab ${navigation.view === "studio" ? "active" : ""}`} onClick={openStudio}><span className="slice-index">OBS 04</span>World Studio</button></nav><div className="header-actions"><button className="quiet-button" onClick={openContinuity}>Continuity</button><button className="quiet-button" onClick={openContext}>World context</button></div></header>{pending && navigation.view !== "action" && <div className="pending-action-ribbon" role="status"><span className="status-indicator" /><strong>{pendingLabel}</strong><span>Your current world truth is unchanged. Return to World to continue this action.</span><button onClick={openWorld}>Return to action</button></div>}{navigation.view === "action" ? <P1Action world={world} setWorld={setWorld} action={action} setAction={setAction} onOpenLens={openLens} onOpenContext={openContext} onOpenStudio={openStudio} /> : navigation.view === "return" ? <P2Return world={world} onOpenLens={openLens} onOpenContext={openContext} onEnterWorld={openWorld} /> : navigation.view === "recovery" ? <RecoveryLab currentRecord={world.currentRecord} history={world.history} initialMode={preview.get("recovery") === "stale" ? "stale" : "overview"} onReturnWorld={openWorld} onOpenLens={() => openLens("beacon")} /> : <WorldStudio currentRecord={world.currentRecord} beacon={world.beacon} maren={world.maren} watchPledged={world.watchPledged} draft={studioDraft} onDraftChange={setStudioDraft} onReturnWorld={openWorld} />}{navigation.continuityOpen && !navigation.lensTarget && <ContinuityOverview world={world} onOpenLens={openLens} onClose={closeOverlay} />}{navigation.lensTarget && <ContinuityLens world={world} onCorrect={applyCorrection} target={navigation.lensTarget} returnLabel={navigation.continuityOpen ? "Back to Continuity" : "Close Lens"} onClose={closeOverlay} />}{navigation.contextOpen && <WorldContextSheet world={world} action={action} onClose={closeOverlay} onOpenStudio={openStudio} onOpenRecovery={openRecovery} />}<MobileNav active={activeMobile} onWorld={openWorld} onContinuity={openContinuity} onMore={openContext} /></div>;
}
