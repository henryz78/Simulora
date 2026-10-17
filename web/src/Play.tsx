import { useEffect, useRef, useState } from "react";
import type { Change, NodeSummary, SaveView, Settings, TurnNode, WorldState } from "../../shared/types.ts";
import { api, playTurn } from "./api.ts";
import { lang, t } from "./i18n.ts";

const sep = lang === "zh" ? "：" : ": ";

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
  const [showSettings, setShowSettings] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = () => api.save(saveId).then(setView, (e: Error) => setError(e.message));
  useEffect(() => void load(), [saveId]);
  useEffect(() => {
    // Newer browsers return a Promise here; an effect must not return it.
    void bottom.current?.scrollIntoView({ block: "end" });
  }, [view?.path.length, pending?.story]);

  if (!view) return <main className="page">{error || t("Loading…")}</main>;
  const { save, world, path, tree } = view;
  const head = path.at(-1)!;
  const state = head.state;
  const busy = pending !== null && !pending.error;
  // A character can leave the world (an undo, a branch); then the player speaks as director.
  const wanted = actor ?? head.actor;
  const current = state.characters.some((c) => c.id === wanted) ? wanted : "director";

  async function send(text: string, as = current) {
    setPending({ actor: as, input: text, story: "", phase: "story", error: "" });
    setInput("");
    try {
      await playTurn(saveId, as, text, {
        story: (piece) => setPending((p) => p && { ...p, story: p.story + piece }),
        phase: () => setPending((p) => p && { ...p, phase: "changes" }),
      });
      await load();
      setPending(null);
    } catch (e) {
      setPending((p) => p && { ...p, error: (e as Error).message });
    }
  }

  const goTo = async (nodeId: string) => setView(await api.moveHead(saveId, nodeId));
  const branch = async (nodeId: string) => {
    const created = await api.branch(saveId, nodeId);
    location.hash = `#/play/${created.id}`;
  };
  const changeSettings = async (patch: Partial<Settings>) => setView(await api.settings(saveId, patch));
  const suggest = async () => {
    setSuggesting(true);
    try {
      await api.hooks(saveId);
      await load();
    } finally {
      setSuggesting(false);
    }
  };

  const placeName = (id: string | null) => state.places.find((p) => p.id === id)?.name;
  const charName = (id: string) => state.characters.find((c) => c.id === id)?.name ?? "?";
  const known = state.facts.filter((f) => !f.secret);
  const secrets = state.facts.filter((f) => f.secret);
  const hidden = secrets.filter((f) => !f.revealed);

  return (
    <main className="play">
      <header className="bar">
        <a href="#/">← {t("Home")}</a>
        <span className="title">
          {world.title}
          <span className="muted"> · {save.title}</span>
        </span>
        <span className="row">
          <a className="button" href={`#/studio/${world.id}`}>
            {t("Edit world")}
          </a>
          <button onClick={() => setShowSettings(!showSettings)}>{t("Settings")}</button>
        </span>
      </header>

      {showSettings && (
        <section className="panel settings">
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
        </section>
      )}

      <div className="layout">
        <section className="story">
          {path.map((node: TurnNode, i) => {
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
                {node.changes.length > 0 && (
                  <ul className="changes">
                    {node.changes.map((c, j) => (
                      <li key={j}>{c.note || describe(c)}</li>
                    ))}
                  </ul>
                )}
                <div className="turn-tools">
                  {node !== head && !busy && (
                    <button className="link" onClick={() => goTo(node.id)}>
                      {t("Go back here")}
                    </button>
                  )}
                  {!busy && (
                    <button className="link" onClick={() => branch(node.id)}>
                      {t("Branch from here")}
                    </button>
                  )}
                  {others.length > 0 && !busy && (
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
              </article>
            );
          })}

          {pending && (
            <article className="turn pending">
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
              if (!busy) void send(input.trim());
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
                  if (!busy) void send(input.trim());
                }
              }}
            />
            <div className="row">
              <button className="primary" type="submit" disabled={busy}>
                {input.trim() ? t("Send") : t("Let it unfold")}
              </button>
              {head.parentId && (
                <button type="button" className="link" disabled={busy} onClick={() => goTo(head.parentId!)}>
                  {t("Undo last turn")}
                </button>
              )}
            </div>
          </form>
          <div ref={bottom} />
        </section>

        <aside className="world">
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

          <h3>{t("Places")}</h3>
          <ul>
            {state.places.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>

          <h3>{t("Known facts")}</h3>
          <ul>
            {known.map((f) => (
              <li key={f.id}>{f.text}</li>
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
                    {charName(r.a)} · {charName(r.b)}{sep}{r.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
