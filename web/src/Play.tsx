import { useEffect, useRef, useState } from "react";
import type { Change, NodeSummary, SaveView, Settings, TurnNode, WorldState } from "../../shared/types.ts";
import { api, playTurn } from "./api.ts";
import { lang, t } from "./i18n.ts";

const sep = lang === "zh" ? "：" : ": ";

type Panel = "history" | "world" | "settings" | null;

interface Pending {
  actor: string;
  input: string;
  story: string;
  phase: "story" | "changes";
  error: string;
}

const actorLabel = (state: WorldState, actor: string) =>
  actor === "director" ? t("Director") : (state.characters.find((c) => c.id === actor)?.name ?? "?");

/** Words for a change the model left without a note. */
function describe(c: Change): string {
  switch (c.type) {
    case "move":
      return `${c.character} → ${c.place}`;
    case "place":
      return c.name;
    case "character":
      return c.name;
    case "status":
      return `${c.character}${sep}${c.notes}`;
    case "fact":
      return c.text;
    case "reveal":
      return t("Revealed");
    case "learn":
      return c.character;
    case "relationship":
      return `${c.a} · ${c.b}${sep}${c.text}`;
    case "thread":
      return c.title;
    case "resolve":
      return c.resolution;
    case "clock":
      return c.text;
  }
}

/** The newest turn under a node, so switching to another path lands at its latest point. */
function latestLeaf(tree: NodeSummary[], id: string): string {
  const children = tree.filter((n) => n.parentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return children[0] ? latestLeaf(tree, children[0].id) : id;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </>
  );
}

export function Play({ saveId }: { saveId: string }) {
  const [view, setView] = useState<SaveView | null>(null);
  const [error, setError] = useState("");
  const [actor, setActor] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [suggesting, setSuggesting] = useState(false);
  // The next move the player wrote while the last turn's changes were still being recorded.
  const [queued, setQueued] = useState<{ text: string; actor: string } | null>(null);
  const queuedRef = useRef(queued);
  queuedRef.current = queued;
  const sceneTop = useRef<HTMLDivElement>(null);
  const pendingTop = useRef<HTMLElement>(null);

  const load = () => api.save(saveId).then(setView, (e: Error) => setError(e.message));
  useEffect(() => void load(), [saveId]);
  const report = (e: Error) => setError(t(e.message));
  // A new save opens with suggestions too, like every later turn.
  const openingId = view && view.path.length === 1 && view.path[0]!.hooks.length === 0 ? view.path[0]!.id : null;
  const asked = useRef<string | null>(null); // StrictMode runs effects twice; ask once
  useEffect(() => {
    if (openingId && asked.current !== openingId) {
      asked.current = openingId;
      void suggest();
    }
  }, [openingId]);
  // Each new scene, and each move as it starts, opens at its first line so the player reads from the top.
  // Newer browsers return a Promise from scrollIntoView; an effect must not return it.
  useEffect(() => {
    void sceneTop.current?.scrollIntoView({ block: "start" });
  }, [view?.path.at(-1)?.id]);
  useEffect(() => {
    void pendingTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [pending === null]);

  if (!view) return <main className="page">{error || t("Loading…")}</main>;
  const { save, world, path, tree } = view;
  const head = path.at(-1)!;
  const state = head.state;
  const busy = pending !== null && !pending.error;
  // A character can leave the world (an undo, a branch); then the player speaks as director.
  const wanted = actor ?? head.actor;
  const current = state.characters.some((c) => c.id === wanted) ? wanted : "director";

  async function send(text: string, as = current, from = head.id) {
    setPending({ actor: as, input: text, story: "", phase: "story", error: "" });
    setInput("");
    setError("");
    try {
      const node = await playTurn(saveId, as, text, {
        story: (piece) => setPending((p) => p && { ...p, story: p.story + piece }),
        phase: () => setPending((p) => p && { ...p, phase: "changes" }),
      });
      await load();
      setPending(null);
      const next = queuedRef.current;
      setQueued(null);
      if (next) await send(next.text, next.actor, node.id);
    } catch (e) {
      // The connection can drop after the server already saved the turn; then there is nothing to retry.
      const fresh = await api.save(saveId).catch(() => null);
      if (fresh && fresh.path.at(-1)!.parentId === from) {
        setView(fresh);
        setPending(null);
      } else setPending((p) => p && { ...p, error: t((e as Error).message) });
    }
  }

  // The story is readable while its changes are recorded, so the player can already write the next move.
  const canQueue = busy && pending.phase === "changes" && !queued;
  function submit() {
    if (!busy) return void send(input.trim());
    if (!canQueue) return;
    setQueued({ text: input.trim(), actor: current });
    setInput("");
  }

  const goTo = (nodeId: string) => api.moveHead(saveId, nodeId).then(setView, report);
  const branch = (nodeId: string) =>
    api
      .branch(saveId, nodeId, `${t("Branch")} ${new Date().toLocaleString()}`)
      .then((created) => (location.hash = `#/play/${created.id}`), report);
  const rename = () => {
    const title = prompt(t("Name this save"), save.title)?.trim();
    if (title) api.rename(saveId, title).then(setView, report);
  };
  const changeSettings = (patch: Partial<Settings>) => api.settings(saveId, patch).then(setView, report);
  const recordAgain = () => api.records(saveId).then(setView, report);
  async function suggest() {
    setSuggesting(true);
    try {
      await api.hooks(saveId);
      await load();
    } catch (e) {
      report(e as Error);
    } finally {
      setSuggesting(false);
    }
  }

  const placeName = (id: string | null) => state.places.find((p) => p.id === id)?.name;
  const charName = (id: string) => state.characters.find((c) => c.id === id)?.name ?? "?";
  const known = state.facts.filter((f) => !f.secret);
  const secrets = state.facts.filter((f) => f.secret);
  const hidden = secrets.filter((f) => !f.revealed);

  const turnView = (node: TurnNode, i: number) => {
    const next = path[i + 1];
    const others = tree.filter((n) => n.parentId === node.id && n.id !== next?.id);
    return (
      <article className="turn" key={node.id}>
        {i > 0 && (
          <p className="action">
            <strong>{actorLabel(path[i - 1]!.state, node.actor)}</strong>
            {node.input ? `${sep}${node.input}` : ` · ${t("Let it unfold")}`}
          </p>
        )}
        <Paragraphs text={node.story} />
        {node.recordsFailed && node === head && (
          <p className="error small">
            {t("Couldn't record what changed in this turn.")}{" "}
            <button disabled={busy} onClick={recordAgain}>
              {t("Record again")}
            </button>
          </p>
        )}
        {node.changes.length > 0 && (
          <details className="changes">
            <summary>
              {t("What changed")} ({node.changes.length})
            </summary>
            <ul>
              {node.changes.map((c, j) => (
                <li key={j}>{c.note || describe(c)}</li>
              ))}
            </ul>
          </details>
        )}
        {!busy && (
          <div className="turn-tools">
            {node !== head && (
              <button className="link" onClick={() => goTo(node.id)}>
                {t("Go back here")}
              </button>
            )}
            <button className="link" onClick={() => branch(node.id)}>
              {t("Branch from here")}
            </button>
            {others.length > 0 && (
              <span className="muted small">
                {t("Other paths")}:
                {others.map((o) => (
                  <button key={o.id} className="link" onClick={() => goTo(latestLeaf(tree, o.id))}>
                    {o.input.slice(0, 16) || t("Let it unfold")}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
      </article>
    );
  };
  const toggle = (name: Panel) => setPanel(panel === name ? null : name);

  return (
    <main className={panel ? "play with-side" : "play"}>
      <header className="bar">
        <a href="#/">← {t("Home")}</a>
        <span className="title">
          {world.title}
          <span className="muted small"> · {save.title}</span>
        </span>
        <span className="row">
          {path.length > 1 && (
            <button className={panel === "history" ? "on" : ""} onClick={() => toggle("history")}>
              {t("Story so far")}
            </button>
          )}
          <button className={panel === "world" ? "on" : ""} onClick={() => toggle("world")}>
            {t("World")}
          </button>
          <button className={panel === "settings" ? "on" : ""} onClick={() => toggle("settings")}>
            {t("Settings")}
          </button>
        </span>
      </header>

      {error && <p className="error">{error}</p>}

      {/* The page holds only the current scene; the past, the world and the settings open beside it. */}
      <section className="story">
        <div ref={sceneTop} />
        {turnView(head, path.length - 1)}

        {pending && (
          <article className="turn pending" ref={pendingTop}>
            <p className="action">
              <strong>{actorLabel(state, pending.actor)}</strong>
              {pending.input ? `${sep}${pending.input}` : ` · ${t("Let it unfold")}`}
            </p>
            <Paragraphs text={pending.story} />
            {!pending.error && (
              <p className="muted small">{pending.phase === "story" ? t("Writing…") : t("Recording what changed…")}</p>
            )}
            {pending.error && (
              <p className="error">
                {pending.error}{" "}
                <button onClick={() => send(pending.input, pending.actor)}>{t("Retry")}</button>
              </p>
            )}
          </article>
        )}

        {queued && (
          <p className="action queued">
            <strong>{actorLabel(state, queued.actor)}</strong>
            {queued.text ? `${sep}${queued.text}` : ` · ${t("Let it unfold")}`}
            <span className="muted small"> · {t("sends when the changes are recorded")} </span>
            <button className="link" onClick={() => setQueued(null)}>
              {t("Cancel")}
            </button>
          </p>
        )}

        {!busy && (
          <div className="hooks">
            {head.hooks.map((hook) => (
              <button key={hook} className="hook" onClick={() => send(hook)}>
                {hook}
              </button>
            ))}
            {head.hooks.length === 0 && (
              <button className="link" disabled={suggesting} onClick={suggest}>
                {suggesting ? t("Writing…") : t("Suggest next steps")}
              </button>
            )}
          </div>
        )}

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label>
            {t("Act as")}
            <select value={current} onChange={(e) => setActor(e.target.value)}>
              <option value="director">{t("Director")}</option>
              {state.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            rows={3}
            placeholder={t("What happens?")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="row">
            <button className="primary" type="submit" disabled={busy && !canQueue}>
              {busy ? t("Send when ready") : input.trim() ? t("Send") : t("Let it unfold")}
            </button>
            {head.parentId && (
              <button type="button" className="link" disabled={busy} onClick={() => goTo(head.parentId!)}>
                {t("Undo last turn")}
              </button>
            )}
          </div>
        </form>
      </section>

      {panel && (
        <aside className="side">
          <div className="side-head">
            <h2>{t(panel === "history" ? "Story so far" : panel === "world" ? "World" : "Settings")}</h2>
            <button className="link" onClick={() => setPanel(null)} aria-label={t("Close")}>
              ✕
            </button>
          </div>

          {panel === "history" && path.slice(0, -1).map(turnView)}

          {panel === "world" && (
            <div className="world">
              <h3>{t("Time")}</h3>
              <p>{state.clock || "—"}</p>

              <h3>{t("People")}</h3>
              <ul>
                {state.characters.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong>
                    {placeName(c.placeId) && <span className="muted"> · {t("at")} {placeName(c.placeId)}</span>}
                    {c.notes && <div className="small">{c.notes}</div>}
                  </li>
                ))}
              </ul>

              <h3>
                {t("Secrets")} <span className="muted small">{secrets.length - hidden.length}/{secrets.length}</span>
              </h3>
              <ul>
                {secrets
                  .filter((f) => f.revealed)
                  .map((f) => (
                    <li key={f.id}>
                      <span className="tag">{t("Revealed")}</span> {f.text}
                    </li>
                  ))}
                {save.settings.showSecrets
                  ? hidden.map((f) => (
                      <li key={f.id} className="muted">
                        {f.text}
                      </li>
                    ))
                  : hidden.length > 0 && (
                      <li className="muted">
                        {hidden.length} {t("undiscovered")}
                      </li>
                    )}
              </ul>

              <h3>{t("Open questions")}</h3>
              <ul>
                {state.threads.map((th) => (
                  <li key={th.id} className={th.resolved ? "muted" : ""}>
                    {th.resolved && <span className="tag">{t("Resolved")}</span>} {th.title}
                    {th.resolution && <div className="small">{th.resolution}</div>}
                  </li>
                ))}
              </ul>

              {state.relationships.length > 0 && (
                <>
                  <h3>{t("Relationships")}</h3>
                  <ul>
                    {state.relationships.map((r) => (
                      <li key={`${r.a}-${r.b}`}>
                        {charName(r.a)} · {charName(r.b)}
                        {sep}
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3>{t("Known facts")}</h3>
              <ul>
                {known.map((f) => (
                  <li key={f.id}>{f.text}</li>
                ))}
              </ul>

              <h3>{t("Places")}</h3>
              <ul>
                {state.places.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          )}

          {panel === "settings" && (
            <div className="settings">
              <label>
                {t("Voice")}
                <select value={save.settings.person} onChange={(e) => changeSettings({ person: e.target.value as Settings["person"] })}>
                  <option value="third">{t("Third person")}</option>
                  <option value="second">{t("Second person")}</option>
                </select>
              </label>
              <label>
                {t("AI initiative")}
                <select value={save.settings.pace} onChange={(e) => changeSettings({ pace: e.target.value as Settings["pace"] })}>
                  <option value="calm">{t("Calm")}</option>
                  <option value="medium">{t("Medium")}</option>
                  <option value="intense">{t("Intense")}</option>
                </select>
              </label>
              <label>
                {t("Length")}
                <select value={save.settings.length} onChange={(e) => changeSettings({ length: e.target.value as Settings["length"] })}>
                  <option value="auto">{t("AI decides")}</option>
                  <option value="short">{t("Shorter")}</option>
                  <option value="long">{t("Longer")}</option>
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={save.settings.showSecrets}
                  onChange={(e) => changeSettings({ showSecrets: e.target.checked })}
                />
                {t("Show all secrets")}
              </label>
              <div className="row">
                <button onClick={rename}>{t("Rename")}</button>
                <a className="button" href={`#/studio/${world.id}`} title={t("Changes only apply to new saves")}>
                  {t("Edit world")}
                </a>
              </div>
            </div>
          )}
        </aside>
      )}
    </main>
  );
}
