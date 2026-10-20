import { useState } from "react";
import type { Character, Save, Settings, TurnNode, WorldState } from "../../shared/types.ts";
import { lang, t } from "./i18n.ts";
import { Turn, type TurnTools } from "./Turn.tsx";
import { Avatar, Icon, turnLabel, useLook } from "./ui.tsx";

/** A heading with a count, and a button to show what it hides. */
function Fold({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div>
      <button className="quiet small" style={{ paddingLeft: 0 }} aria-expanded={open} onClick={() => setOpen(!open)}>
        {title} · {count} {open ? "▾" : "▸"}
      </button>
      {open && <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>}
    </div>
  );
}

// ── The world: who is here, who elsewhere, what was found, what is open. ──
export function WorldPanel({
  state,
  me,
  director,
  showSecrets,
  onInterview,
  onMap,
}: {
  state: WorldState;
  /** The character the player has been playing, if any. */
  me: string | null;
  director: boolean;
  showSecrets: boolean;
  onInterview: (id: string) => void;
  onMap: () => void;
}) {
  const place = (id: string | null) => state.places.find((p) => p.id === id)?.name;
  const name = (id: string) => state.characters.find((c) => c.id === id)?.name ?? "?";
  const mine = state.characters.find((c) => c.id === me);
  const scene = mine?.placeId ?? null;
  const cast = state.characters.filter((c) => !c.gone);
  // Someone placed nowhere may be here, as the story reads it too.
  const here = cast.filter((c) => !scene || !c.placeId || c.placeId === scene).sort((a) => (a.id === me ? -1 : 1));
  const away = scene ? cast.filter((c) => c.placeId && c.placeId !== scene) : [];
  const gone = state.characters.filter((c) => c.gone);
  const secrets = state.facts.filter((f) => f.secret);
  const found = secrets.filter((f) => f.revealed);
  const hidden = secrets.filter((f) => !f.revealed);
  // The newest few open questions; the rest, and the answered ones, folded.
  const open = state.threads.filter((th) => !th.resolved && !th.archived).reverse();
  const closed = state.threads.filter((th) => th.resolved && !th.archived);
  const known = state.facts.filter((f) => !f.secret);
  const ties = state.relationships.filter((r) => me && (r.a === me || r.b === me));
  const person = (c: Character) => (
    <div className="person" key={c.id}>
      <Avatar name={c.name} me={c.id === me} />
      <div className="grow">
        <b>{c.name}</b> {c.id === me && <span className="muted small">{t("you")}</span>}
        {c.notes && <span className="now">{c.notes}</span>}
      </div>
      {c.id !== me && (
        <button className="small" onClick={() => onInterview(c.id)}>
          {t("Interview")}
        </button>
      )}
    </div>
  );
  const line = (c: Character, where: string | undefined, how: string) => (
    <div className="kv" key={c.id}>
      <span className="row" style={{ justifyContent: "space-between" }}>
        <span>
          <b style={{ fontWeight: 600 }}>{c.name}</b>
          {where && <span className="muted"> · {where}</span>}
        </span>
        <button className="quiet small" onClick={() => onInterview(c.id)}>
          {t("Interview")}
        </button>
      </span>
      {how && <span className="muted small">{how}</span>}
    </div>
  );

  return (
    <div className="panel-body">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>
          {director ? t("The whole world") : (place(scene) ?? t("Somewhere"))}
        </span>
        <span className="muted small">{state.clock || "—"}</span>
      </div>

      {director ? (
        <section>
          <h3 className="label">{t("People by place")}</h3>
          {[...state.places, { id: null, name: t("Nowhere in particular"), description: "" }].map((p) => {
            const there = cast.filter((c) => c.placeId === p.id);
            return (
              there.length > 0 && (
                <div key={p.id ?? "none"} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  {there.map((c) => line(c, undefined, c.notes))}
                </div>
              )
            );
          })}
        </section>
      ) : (
        <section>
          <h3 className="label">
            {t("Here")} · {here.length}
          </h3>
          {here.map(person)}
          <Fold title={t("Elsewhere")} count={away.length}>
            {away.map((c) => line(c, place(c.placeId), c.notes))}
          </Fold>
        </section>
      )}
      <Fold title={t("Out of the story")} count={gone.length}>
        {gone.map((c) => line(c, undefined, c.gone ?? ""))}
      </Fold>

      <section>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 className="label">{t("Discovery book")}</h3>
          <span className="badge secret">
            {found.length} / {secrets.length}
          </span>
        </div>
        {found.map((f) => (
          <div className="note secret" key={f.id} style={{ padding: 12, gap: 4 }}>
            <span>{f.text}</span>
            <span className="muted small">
              {f.revealNote && `${f.revealNote} · `}
              {t(f.source === "ai" ? "Buried by the AI" : "Yours")}
            </span>
          </div>
        ))}
        {showSecrets
          ? hidden.map((f) => (
              <div className="lock" key={f.id} style={{ padding: "8px 10px", alignItems: "flex-start" }}>
                <Icon name="lock" />
                <span>{f.text}</span>
              </div>
            ))
          : hidden.length > 0 && (
              <div className="lock">
                <Icon name="lock" />
                {lang === "zh" ? `还有 ${hidden.length} 个秘密没被发现` : `${hidden.length} secrets not found yet`}
              </div>
            )}
      </section>

      <section>
        <h3 className="label">
          {t("Open questions")} · {open.length}
        </h3>
        {open.slice(0, 3).map((th) => (
          <span key={th.id} style={{ fontSize: 14 }}>
            {th.title}
          </span>
        ))}
        <Fold title={t("Older")} count={open.length - 3 > 0 ? open.length - 3 : 0}>
          {open.slice(3).map((th) => (
            <div className="kv" key={th.id}>
              {th.title}
            </div>
          ))}
        </Fold>
        <Fold title={t("Resolved")} count={closed.length}>
          {closed.map((th) => (
            <div className="kv" key={th.id}>
              <span className="muted" style={{ textDecoration: "line-through" }}>
                {th.title}
              </span>
              {th.resolution && <span className="small">{th.resolution}</span>}
            </div>
          ))}
        </Fold>
        <Fold title={t("Known facts")} count={known.length}>
          {known.map((f) => (
            <div className="kv" key={f.id}>
              {f.text}
            </div>
          ))}
        </Fold>
      </section>

      <section>
        <h3 className="label">{t("Relationships")}</h3>
        {ties.slice(-3).reverse().map((r) => (
          <span key={`${r.a}-${r.b}`} style={{ fontSize: 14 }}>
            <b style={{ fontWeight: 600 }}>{name(r.a === me ? r.b : r.a)}</b> · {r.text}
          </span>
        ))}
        <Fold title={t("Older")} count={Math.max(0, ties.length - 3)}>
          {ties.slice(0, -3).reverse().map((r) => (
            <div className="kv" key={`${r.a}-${r.b}`}>
              <span>
                <b style={{ fontWeight: 600 }}>{name(r.a === me ? r.b : r.a)}</b> · {r.text}
              </span>
            </div>
          ))}
        </Fold>
        {state.relationships.length > 0 && (
          <div>
            <button className="small" onClick={onMap}>
              <Icon name="graph" />
              {t("Open the relationship map")}
            </button>
          </div>
        )}
      </section>

      <Fold title={t("Places")} count={state.places.length}>
        {state.places.map((p) => (
          <div className="kv" key={p.id}>
            {p.name}
          </div>
        ))}
      </Fold>
    </div>
  );
}

// ── The story so far: the recap, the memory, the timeline, and every turn. ──
export function HistoryPanel({
  path,
  state,
  recall,
  recalling,
  expanded,
  setExpanded,
  toolsFor,
}: {
  path: TurnNode[];
  state: WorldState;
  recall: () => void;
  recalling: boolean;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  toolsFor: (node: TurnNode, index: number) => TurnTools;
}) {
  const [allNotes, setAllNotes] = useState(false);
  const chronicled = path.findLast((n) => Array.isArray(n.timeline));
  const notes = chronicled?.memory ?? [];
  const span = (from: number, to: number) => `${from}–${to}`;
  // Newest first; the turn now being played is on the page itself.
  const turns = path.map((node, i) => ({ node, i })).slice(1, -1).reverse();

  return (
    <div className="panel-body">
      {path.length > 1 && (
        <div>
          <button onClick={recall} disabled={recalling}>
            {recalling ? t("Writing…") : t("Previously")}
          </button>
        </div>
      )}
      {notes.length > 0 && (
        <section>
          <h3 className="label">
            {t("Memory")} · {notes.length}
          </h3>
          {(allNotes ? notes : notes.slice(0, 3)).map((note, i) => (
            <div className="memo" key={i}>
              <span className="t">{turnLabel(note.turn)}</span>
              <span>{note.text}</span>
            </div>
          ))}
          {notes.length > 3 && (
            <div>
              <button className="quiet small" style={{ paddingLeft: 0 }} onClick={() => setAllNotes(!allNotes)}>
                {allNotes ? t("Fewer") : `${t("All")} ${notes.length} ▸`}
              </button>
            </div>
          )}
        </section>
      )}
      {chronicled?.timeline?.length ? (
        <section>
          <h3 className="label">{t("Timeline")}</h3>
          {chronicled.timeline.map((entry) => (
            <div className="memo" key={entry.from}>
              <span className="t">{span(entry.from, entry.to)}</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </section>
      ) : null}
      {turns.length > 0 && (
        <section style={{ gap: 0 }}>
          <h3 className="label" style={{ marginBottom: 6 }}>
            {t("Every turn")}
          </h3>
          {turns.map(({ node, i }) => {
            const tools = toolsFor(node, i);
            const isOpen = expanded === node.id;
            return (
              <div key={node.id} id={`turn-${node.id}`}>
                <button className="turn-row" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : node.id)}>
                  <span className="n">{i}</span>
                  <span className="grow" style={{ fontWeight: isOpen ? 600 : 400 }}>
                    {node.offline ? t("While you were away") : node.input || t("Let it unfold")}
                  </span>
                  {!tools.resumable(node.id) && <span className="muted small">{t("read only")}</span>}
                  <span className="muted">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="past">
                    <Turn node={node} index={i} state={state} head={false} compact tools={tools} />
                    {!tools.resumable(node.id) && (
                      <span className="muted small">{t("Read only: too far back to return to.")}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <span className="muted small" style={{ paddingTop: 8 }}>
            {t("Every tenth turn and the latest ten can be returned to.")}
          </span>
        </section>
      )}
    </div>
  );
}

/** A few buttons, one of them pressed. */
function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
      {label}
      <div className="seg" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Switch({ checked, title, hint, onChange }: { checked: boolean; title: string; hint: string; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {title}
        <span className="hint">{hint}</span>
      </span>
    </label>
  );
}

// ── Settings, in four groups. ──
export function SettingsPanel({
  save,
  worldId,
  change,
  rename,
  saveNotes,
}: {
  save: Save;
  worldId: string;
  change: (patch: Partial<Settings>) => void;
  rename: (title: string) => void;
  saveNotes: (notes: string) => Promise<unknown>;
}) {
  const [look, setLook] = useLook();
  const [saved, setSaved] = useState(false);
  const s = save.settings;
  return (
    <div className="panel-body" style={{ gap: 22 }}>
      <section>
        <h3 className="label">{t("This save")}</h3>
        <label>
          {t("Name")}
          <input
            key={save.title}
            defaultValue={save.title}
            maxLength={200}
            onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== save.title && rename(e.target.value.trim())}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
        </label>
        <label>
          <span>
            {t("Notes")} <span className="muted small">{t("read every turn, up to 2000 characters")}</span>
          </span>
          <textarea
            key={save.notes ?? ""}
            defaultValue={save.notes ?? ""}
            maxLength={2000}
            rows={3}
            placeholder={t("What the story must never forget; read every turn")}
            onFocus={() => setSaved(false)}
            onBlur={(e) =>
              e.target.value !== (save.notes ?? "") && saveNotes(e.target.value).then(() => setSaved(true))
            }
          />
          {saved && <span className="muted small" role="status">{t("Saved")}</span>}
        </label>
      </section>

      <section>
        <h3 className="label">{t("How the story is told")}</h3>
        <Seg label={t("Writing")} value={s.style ?? "plain"} options={[["plain", t("Plain and clear")], ["literary", t("Literary")]]} onChange={(style) => change({ style })} />
        <Seg label={t("Length")} value={s.length} options={[["short", t("Shorter")], ["auto", t("Standard length")], ["long", t("Longer")]]} onChange={(length) => change({ length })} />
        <Seg label={t("Voice")} value={s.person} options={[["third", t("Third person")], ["second", t("Second person")]]} onChange={(person) => change({ person })} />
        <Seg label={t("How much the others push the story")} value={s.pace} options={[["calm", t("Calm")], ["medium", t("Medium")], ["intense", t("Intense")]]} onChange={(pace) => change({ pace })} />
      </section>

      <section>
        <h3 className="label">{t("Play")}</h3>
        <Switch checked={s.dice ?? false} title={t("Dice of fate")} hint={t("a risky attempt is settled by a die: success, success at a cost, or failure")} onChange={(dice) => change({ dice })} />
        <Switch checked={s.meanwhile ?? true} title={t("The world moves on its own")} hint={t("every few turns, the people away act on their plans")} onChange={(meanwhile) => change({ meanwhile })} />
        <label>
          <span>
            {t("Back after a day or more")}
            <span className="hint">{t("the world lives those days first (up to seven), skipping the moment you left")}</span>
          </span>
          <select value={s.offline ?? "off"} onChange={(e) => change({ offline: e.target.value as Settings["offline"] })}>
            <option value="off">{t("The world waits")}</option>
            <option value="world">{t("The world, but my character stays")}</option>
            <option value="all">{t("The whole world, my character too")}</option>
          </select>
        </label>
        <Switch checked={s.thinking ?? false} title={t("Deep thinking")} hint={t("better plotted, but the first words take 30-80 s")} onChange={(thinking) => change({ thinking })} />
        <Switch checked={s.showSecrets} title={t("Show all secrets")} hint={t("spoils them: the undiscovered ones are listed in the discovery book")} onChange={(showSecrets) => change({ showSecrets })} />
      </section>

      <section>
        <h3 className="label">{t("Appearance")}</h3>
        <div className="seg" role="group" aria-label={t("Appearance")}>
          {(
            [
              ["system", t("Follow the system")],
              ["light", t("Day")],
              ["dark", t("Night")],
            ] as const
          ).map(([v, text]) => (
            <button key={v} type="button" aria-pressed={look === v} onClick={() => setLook(v)}>
              {text}
            </button>
          ))}
        </div>
      </section>

      <div>
        <a className="button" href={`#/studio/${worldId}`}>
          {t("Edit this world")}
        </a>
        <span className="hint" style={{ marginTop: 6 }}>
          {t("Changes only apply to new saves")}
        </span>
      </div>
    </div>
  );
}

// ── A talk out of the story with one person. ──
export function InterviewPanel({
  guest,
  talk,
  asking,
  question,
  setQuestion,
  ask,
}: {
  guest: Character;
  talk: { q: string; a: string }[];
  asking: boolean;
  question: string;
  setQuestion: (q: string) => void;
  ask: () => void;
}) {
  return (
    <div className="panel-body" style={{ gap: 16 }}>
      <span className="note muted small" style={{ padding: "10px 12px" }}>
        {t("Out of the story: nothing said here changes the world, and they will not remember it.")}
      </span>
      {talk.map((x, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="qa">
            <span className="muted small">{t("You ask")}</span>
            <span>{x.q}</span>
          </div>
          <div className="qa">
            <span className="muted small">{guest.name}</span>
            <span className="serif" style={{ fontSize: 15 }}>
              {x.a}
            </span>
          </div>
        </div>
      ))}
      {asking && (
        <p className="muted small" role="status">
          {t("Writing…")}
        </p>
      )}
      <form
        className="row"
        style={{ flexWrap: "nowrap", paddingTop: 8, borderTop: "1px solid var(--line)" }}
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <label className="sr" htmlFor="ask">
          {t("Ask them")}
        </label>
        <input
          id="ask"
          value={question}
          placeholder={t("Ask something…")}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask();
            }
          }}
        />
        <button type="submit" className="primary small" disabled={asking || !question.trim()}>
          {t("Ask")}
        </button>
      </form>
    </div>
  );
}
