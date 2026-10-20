import { useEffect, useRef, useState } from "react";
import type { Dice, NodeSummary, SaveView, Settings, TurnNode } from "../../shared/types.ts";
import { api, playTurn } from "./api.ts";
import { Graph } from "./Graph.tsx";
import { lang, t } from "./i18n.ts";
import { Novel } from "./Novel.tsx";
import { HistoryPanel, InterviewPanel, SettingsPanel, WorldPanel } from "./Panels.tsx";
import { ActorLine, Turn, actorLabel, type TurnTools } from "./Turn.tsx";
import { Ask, Avatar, DiceLine, Elapsed, Icon, LookButton, Menu, Paragraphs, turnLabel } from "./ui.tsx";

type Panel = "world" | "history" | "settings" | "interview" | null;

interface Pending {
  actor: string;
  input: string;
  story: string;
  phase: "passing" | "story" | "changes";
  /** Time was skipped: the people away lived it before the story began. */
  passed: boolean;
  /** The story broke off and is being written again. */
  restarted: boolean;
  dice?: Dice;
  offline?: "world" | "all" | null;
  error: string;
  since: number;
}

/** The newest turn under a node, so switching to another path lands at its latest point. */
function latestLeaf(tree: NodeSummary[], id: string): string {
  const children = tree.filter((n) => n.parentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return children[0] ? latestLeaf(tree, children[0].id) : id;
}

const wide = () => matchMedia("(min-width: 1280px)").matches;

export function Play({ saveId }: { saveId: string }) {
  const [view, setView] = useState<SaveView | null>(null);
  const [error, setError] = useState("");
  const [actor, setActor] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  // Docked beside the story on a wide screen from the start; elsewhere it opens when asked.
  const [panel, setPanel] = useState<Panel>(wide() ? "world" : null);
  const [suggesting, setSuggesting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  // A past turn opened in the story so far.
  const [expanded, setExpanded] = useState<string | null>(null);
  // The next move the player wrote while the last turn's changes were still being recorded.
  const [queued, setQueued] = useState<{ text: string; actor: string } | null>(null);
  const queuedRef = useRef(queued);
  queuedRef.current = queued;
  const sceneTop = useRef<HTMLDivElement>(null);
  const report = (e: Error) => setError(t(e.message));

  // A talk out of the story with one character; kept on this page only. Each character's talk is their own: an
  // answer lands with whoever it was asked of.
  const [guest, setGuest] = useState<string | null>(null);
  const [talks, setTalks] = useState<Record<string, { q: string; a: string }[]>>({});
  const talk = (guest && talks[guest]) || [];
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const interview = (id: string) => {
    setGuest(id);
    setPanel("interview");
  };
  const askGuest = () => {
    const q = question.trim();
    const who = guest;
    if (!q || !who || asking) return;
    setAsking(true);
    setQuestion("");
    api
      .interview(saveId, who, talk, q)
      .then(
        (r) => setTalks((all) => ({ ...all, [who]: [...(all[who] ?? []), { q, a: r.answer }] })),
        (e: Error) => {
          setQuestion(q);
          report(e);
        },
      )
      .finally(() => setAsking(false));
  };
  const [mapOpen, setMapOpen] = useState(false);
  const [novelOpen, setNovelOpen] = useState(false);
  // A turn told again through another character's eyes: what is shown, and what is being written.
  const [views, setViews] = useState<Record<string, { who: string; story: string }>>({});
  const [viewing, setViewing] = useState<string | null>(null);
  const seeAs = (node: string, who: string) => {
    setViewing(node);
    api
      .view(saveId, node, who)
      .then(
        (r) => setViews((all) => ({ ...all, [node]: { who, story: r.story } })),
        (e: Error) => report(e),
      )
      .finally(() => setViewing(null));
  };
  // "上回说到": null closed, "" being written, text shown.
  const [recap, setRecap] = useState<string | null>(null);
  const recall = () => {
    setRecap("");
    api.recap(saveId).then(
      (r) => setRecap(r.recap),
      (e: Error) => {
        setRecap(null);
        report(e);
      },
    );
  };

  const load = () => api.save(saveId).then(setView, (e: Error) => setError(e.message));
  useEffect(() => void load(), [saveId]);
  // A new save opens with suggestions too, like every later turn.
  const openingId = view && view.path.length === 1 && view.path[0]!.hooks.length === 0 ? view.path[0]!.id : null;
  const asked = useRef<string | null>(null); // StrictMode runs effects twice; ask once
  useEffect(() => {
    if (openingId && asked.current !== openingId) {
      asked.current = openingId;
      void suggest();
    }
  }, [openingId]);
  // Back after a break (six hours or more) to a story a few turns in: it opens with "上回说到". Judged once, as the save
  // first loads: a tab left open a day must not start the days away as the player types.
  const opened = useRef<SaveView | null>(null);
  if (view && !opened.current) opened.current = view;
  const hoursAway = opened.current ? (Date.now() - Date.parse(opened.current.save.updatedAt)) / 3600_000 : 0;
  const away = opened.current !== null && opened.current.path.length > 3 && hoursAway > 6;
  const recalled = useRef(false);
  useEffect(() => {
    if (!away || recalled.current || !view) return;
    recalled.current = true;
    // A day or more away, with the world set to live on: it lives those days first (two to seven), and that turn
    // tells what changed; otherwise "上回说到". Not on a turn whose changes were never recorded: "Record again" first.
    const way = view.save.settings.offline;
    if ((way === "world" || way === "all") && hoursAway >= 24 && !view.path.at(-1)!.recordsFailed) {
      const days = Math.min(7, Math.max(2, Math.round(hoursAway / 24)));
      void send(lang === "zh" ? `${days}天后` : `${days} days later`, "director", view.path.at(-1)!.id, way);
    } else recall();
  }, [away]);
  // It tells where the story stood: once the player plays on or goes back, it is closed.
  const headId = view?.path.at(-1)?.id;
  const recapFor = useRef(headId);
  useEffect(() => {
    if (recapFor.current !== headId) setRecap(null);
    recapFor.current = headId;
  }, [headId]);
  // Someone undone out of the story has no interview left to show.
  useEffect(() => {
    if (panel === "interview" && view && !view.path.at(-1)!.state.characters.some((c) => c.id === guest))
      setPanel("world");
  }, [view, panel, guest]);
  // Each new scene opens at its first line, so the player reads from the top.
  useEffect(() => {
    void sceneTop.current?.scrollIntoView({ block: "start" });
  }, [headId, recap === null]);
  // Each tab opens at its top.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [panel]);
  // Below 1280 px the panel lies over the page: the page behind it is inert, Esc closes it, and the focus goes into it
  // and comes back to where it was.
  const [isWide, setWide] = useState(wide);
  useEffect(() => {
    const query = matchMedia("(min-width: 1280px)");
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const overlay = panel !== null && !isWide;
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    if (!overlay) return;
    opener.current = document.activeElement;
    panelRef.current?.querySelector<HTMLElement>(".panel-head button, .panel-head [role=tab]")?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog[open]") && setPanel(null);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [overlay]);
  // A turn being written comes into view as it starts.
  const pendingTop = useRef<HTMLElement>(null);
  useEffect(() => {
    void pendingTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [pending === null]);
  // A past turn opened from the page scrolls into view in the story so far.
  useEffect(() => {
    if (expanded && panel === "history")
      void document.getElementById(`turn-${expanded}`)?.scrollIntoView({ block: "start" });
  }, [expanded, panel]);

  if (!view)
    return (
      <main className="home">
        {error ? (
          <div className="note fail" role="alert">
            <b>{t("Could not open this save")}</b>
            <span className="small muted">{t(error)}</span>
            <div>
              <a className="button small" href="#/">
                {t("Your worlds")}
              </a>
            </div>
          </div>
        ) : (
          <p className="muted">{t("Loading…")}</p>
        )}
      </main>
    );
  const { save, world, path, tree } = view;
  const head = path.at(-1)!;
  const state = head.state;
  const busy = pending !== null && !pending.error;
  // At the opening the player starts as the world's first character, its protagonist. A character can leave the
  // world (an undo, a branch); then the player speaks as director.
  const wanted = actor ?? (path.length === 1 ? (state.characters[0]?.id ?? "director") : head.actor);
  const current = state.characters.some((c) => c.id === wanted) ? wanted : "director";
  // The character the player has been playing: the scene is theirs, even while they direct.
  const me =
    (current !== "director" && current) ||
    path.findLast((n) => n.actor !== "director" && state.characters.some((c) => c.id === n.actor))?.actor ||
    state.characters[0]?.id ||
    null;

  async function send(text: string, as = current, from = head.id, offline: "world" | "all" | null = null) {
    setPending({
      actor: as,
      input: text,
      story: "",
      phase: "story",
      passed: false,
      restarted: false,
      error: "",
      since: Date.now(),
      offline,
    });
    setInput("");
    setError("");
    try {
      const node = await playTurn(
        saveId,
        as,
        text,
        {
          story: (piece) => setPending((p) => p && { ...p, story: p.story + piece }),
          dice: (dice) => setPending((p) => p && { ...p, dice }),
          phase: (phase) =>
            setPending(
              (p) =>
                p &&
                (phase === "restart"
                  ? { ...p, story: "", phase: "story", restarted: true }
                  : phase === "passing"
                    ? { ...p, phase, passed: true }
                    : { ...p, phase: phase === "story" ? "story" : "changes" }),
            ),
        },
        offline,
      );
      await load();
      setPending(null);
      const next = queuedRef.current;
      setQueued(null);
      // A turn whose changes were not recorded waits for "Record again" before anything is built on it.
      if (next && !node.recordsFailed) await send(next.text, next.actor, node.id);
    } catch (e) {
      // The days away being lived already (the save open twice, or the page reloaded as it began): wait for them.
      if (offline && (e as Error).message === "A turn is already being written for this save") {
        for (let i = 0; i < 75; i++) {
          await new Promise((done) => setTimeout(done, 2000));
          const fresh = await api.save(saveId).catch(() => null);
          if (fresh && fresh.path.at(-1)!.id !== from) {
            setView(fresh);
            setPending(null);
            return;
          }
        }
      }
      // The connection can drop after the server already saved the turn; then there is nothing to retry.
      const fresh = await api.save(saveId).catch(() => null);
      if (fresh && fresh.path.at(-1)!.parentId === from) {
        setView(fresh);
        setPending(null);
      } else {
        setPending((p) => p && { ...p, error: t((e as Error).message) });
        // The words go back into the box at once, unless the player already wrote something new there.
        if (!offline) setInput((now) => now || text);
      }
      setQueued(null);
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
  // A turn that failed: the words go back into the box to change and send again.
  const editAgain = () => {
    if (!pending) return;
    setInput((now) => now || pending.input);
    setActor(pending.actor);
    setPending(null);
    document.getElementById("act")?.focus();
  };

  const goTo = (nodeId: string) => api.moveHead(saveId, nodeId).then(setView, report);
  const branch = (nodeId: string) =>
    api
      .branch(
        saveId,
        nodeId,
        `${save.title.replace(/ · .*$/, "")} · ${t("branch")} ${new Date().toLocaleTimeString(lang === "zh" ? "zh-CN" : "en", { hour: "2-digit", minute: "2-digit" })}`,
      )
      .then((created) => (location.hash = `#/play/${created.id}`), report);
  const changeSettings = (patch: Partial<Settings>) => void api.settings(saveId, patch).then(setView, report);
  const recordAgain = () => api.records(saveId).then(setView, report);
  async function suggest() {
    setSuggesting(true);
    try {
      await api.hooks(saveId, current);
      await load();
    } catch (e) {
      report(e as Error);
    } finally {
      setSuggesting(false);
    }
  }

  const byId = new Map(tree.map((n) => [n.id, n]));
  const children = Map.groupBy(tree, (n) => n.parentId);
  const resumable = (id: string) => byId.get(id)?.resumable ?? false;
  const toolsFor = (node: TurnNode, i: number): TurnTools => ({
    busy,
    resumable,
    others: (children.get(node.id) ?? []).filter((n) => n.id !== path[i + 1]?.id),
    goTo: (id) => void goTo(id),
    goToLatest: (id) => void goTo(latestLeaf(tree, id)),
    branch: (id) => void branch(id),
    undo:
      i === path.length - 1 && node.parentId && resumable(node.parentId) ? () => void goTo(node.parentId!) : undefined,
    view: views[node.id],
    viewing: viewing === node.id,
    seeAs: (who) => seeAs(node.id, who),
    playAs: (who) => setActor(who),
    openBook: () => setPanel("world"),
  });

  // Who the player can act as, grouped as the composer's menu shows them.
  const scene = state.characters.find((c) => c.id === me)?.placeId ?? null;
  const cast = state.characters.filter((c) => !c.gone);
  const groups: [string, typeof cast][] = [
    [t("Here"), cast.filter((c) => !scene || !c.placeId || c.placeId === scene)],
    [t("Elsewhere"), scene ? cast.filter((c) => c.placeId && c.placeId !== scene) : []],
    [t("Out of the story"), state.characters.filter((c) => c.gone)],
  ];
  const actingAs = actorLabel(state, current);
  const toggle = (name: Panel) => setPanel(panel === name ? null : name);
  const guestCharacter = state.characters.find((c) => c.id === guest);
  const previous = path.length > 1 ? path.at(-2)! : null;
  const sendLabel = busy
    ? canQueue
      ? t("Send when ready")
      : t("Writing…")
    : input.trim()
      ? t("Continue")
      : t("Let it unfold");

  const step = (name: string, now: boolean, done: boolean) => (
    <span className={now ? "step now" : done ? "step done" : "step"}>{name}</span>
  );

  return (
    <div className="play">
      <header className="topbar" inert={overlay}>
        <a href="#/" className="seal" aria-label={t("Your worlds")}>
          拟
        </a>
        <nav className="crumbs" aria-label={t("Where you are")}>
          <a href={`#/world/${world.id}`}>{world.title}</a>
          <span className="sub">
            <span className="muted slash">/</span>
            <button
              className="quiet small"
              aria-label={`${t("Rename")}: ${save.title}`}
              onClick={() => setRenaming(true)}
            >
              {save.title}
            </button>
            <span className="muted small">· {turnLabel(path.length - 1)}</span>
          </span>
        </nav>
        <div role="toolbar" aria-label={t("Panels")} className="row" style={{ gap: 4 }}>
          {path.length > 1 && (
            <button
              className={panel === "history" ? "small on wide" : "quiet small wide"}
              aria-pressed={panel === "history"}
              onClick={() => toggle("history")}
            >
              <Icon name="clock" />
              {t("Story so far")}
            </button>
          )}
          {path.length > 1 && (
            <button className="quiet small wide" onClick={() => setNovelOpen(true)}>
              <Icon name="book" />
              {t("Novel")}
            </button>
          )}
          <button
            className={panel === "world" ? "small on wide" : "quiet small wide"}
            aria-pressed={panel === "world"}
            onClick={() => toggle("world")}
          >
            <Icon name="globe" />
            {t("World")}
          </button>
          <button
            className={panel === "settings" ? "small on wide" : "quiet small wide"}
            aria-pressed={panel === "settings"}
            onClick={() => toggle("settings")}
          >
            <Icon name="sliders" />
            {t("Settings")}
          </button>
          <button
            className="quiet narrow-only"
            aria-label={t("Open the panels: world, story so far, settings")}
            onClick={() => toggle("world")}
          >
            <Icon name="globe" size={18} />
          </button>
          <LookButton />
        </div>
      </header>

      <div className="play-body">
        <main className="reading" inert={overlay}>
          <div className="column">
            <div ref={sceneTop} className="scene-top" />
            {error && (
              <div className="note fail" role="alert">
                <b>{error}</b>
                <div>
                  <button className="small" onClick={() => setError("")}>
                    {t("Close")}
                  </button>
                </div>
              </div>
            )}
            {previous && !pending && (
              <div>
                <button
                  className="quiet small"
                  style={{ paddingLeft: 0 }}
                  onClick={() => {
                    setExpanded(previous.id);
                    setPanel("history");
                  }}
                >
                  ‹ {t("Previous turn")}
                  {sepFor(previous.input || t("Let it unfold"))}
                </button>
              </div>
            )}
            {recap !== null && (
              <div className="note" style={{ background: "transparent", border: "1px solid var(--edge)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>{t("Previously")}</b>
                  <button className="quiet small" onClick={() => setRecap(null)} aria-label={t("Close")}>
                    <Icon name="close" />
                  </button>
                </div>
                {recap ? (
                  <p className="serif" style={{ fontSize: 16, lineHeight: 1.8 }}>
                    {recap}
                  </p>
                ) : (
                  <p className="muted small" role="status">
                    {t("Writing…")}
                  </p>
                )}
              </div>
            )}

            <Turn
              key={head.id}
              node={head}
              index={path.length - 1}
              state={state}
              head
              tools={toolsFor(head, path.length - 1)}
              extra={
                head.recordsFailed && (
                  <div className="note cost" role="alert">
                    <b>{t("The story is written, but this turn's changes were not recorded")}</b>
                    <span>
                      {t("Where people are and what is known still stand as before. Record again, then play on.")}
                    </span>
                    <div>
                      {!busy && (
                        <button className="primary small" onClick={recordAgain}>
                          {t("Record again")}
                        </button>
                      )}
                    </div>
                  </div>
                )
              }
            />

            {pending && (
              <article
                ref={pendingTop}
                className="scene-top"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
                aria-busy={!pending.error}
              >
                {pending.offline && !pending.story && !pending.error ? (
                  <div className="note" role="status">
                    <b>
                      {lang === "zh"
                        ? `你离开了 ${pending.input.replace(/\D/g, "")} 天，世界正在把这几天过完`
                        : `You were away ${pending.input.replace(/\D/g, "")} days: the world is living them`}
                    </b>
                    <span className="muted">
                      {pending.offline === "all"
                        ? t("Everyone acts on their own plans, your character too. Half a minute to a minute.")
                        : t(
                            "Everyone away acts on their own plans; your character stays put. Half a minute to a minute.",
                          )}
                    </span>
                  </div>
                ) : (
                  <ActorLine node={pending} index={path.length} state={state} />
                )}
                {!pending.error && (
                  <div className="steps">
                    {pending.passed &&
                      step(t("Time moves on"), pending.phase === "passing", pending.phase !== "passing")}
                    {step(
                      t("Thinking"),
                      pending.phase === "story" && !pending.story,
                      pending.phase === "changes" || !!pending.story,
                    )}
                    {step(
                      t("Writing the story"),
                      pending.phase === "story" && !!pending.story,
                      pending.phase === "changes",
                    )}
                    {step(t("Recording"), pending.phase === "changes", false)}
                    {/* Read out when the step changes, not every second. */}
                    <span className="sr" role="status">
                      {pending.phase === "passing"
                        ? t("Time moves on")
                        : pending.phase === "changes"
                          ? t("Recording")
                          : pending.story
                            ? t("Writing the story")
                            : t("Thinking")}
                    </span>
                    <span className="muted small" style={{ marginLeft: "auto" }}>
                      <Elapsed since={pending.since} />
                    </span>
                  </div>
                )}
                {pending.restarted && !pending.error && (
                  <div
                    className="note cost"
                    role="status"
                    style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                  >
                    <b>{t("That passage broke off; writing it again")}</b>
                    <span className="muted small">{t("what was written is cleared")}</span>
                  </div>
                )}
                {pending.dice && <DiceLine dice={pending.dice} />}
                {pending.story && (
                  <div className="story">
                    <Paragraphs text={pending.story} caret={pending.phase === "story" && !pending.error} />
                  </div>
                )}
                {pending.error && (
                  <div className="note fail" role="alert">
                    <b>{t("This turn was not written")}</b>
                    <span>{pending.error}</span>
                    <span className="muted small">{t("What you wrote is kept.")}</span>
                    <div className="row">
                      <button
                        className="primary small"
                        onClick={() => send(pending.input, pending.actor, head.id, pending.offline ?? null)}
                      >
                        {t("Retry")}
                      </button>
                      {!pending.offline && (
                        <button className="small" onClick={editAgain}>
                          {t("Change it, then send")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            )}

            {queued && (
              <div className="note">
                <span style={{ fontSize: 14 }}>
                  <b style={{ fontWeight: 600 }}>{t("Queued")}</b>
                  {sepFor(queued.text || t("Let it unfold"))}
                </span>
                <span className="muted small">{t("sends when the changes are recorded")}</span>
                <div>
                  <button className="small" onClick={() => setQueued(null)}>
                    {t("Cancel")}
                  </button>
                </div>
              </div>
            )}

            {!busy && (
              <section aria-labelledby="next" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h2 id="next" className="label">
                    {t("Next")}
                  </h2>
                  {head.hooks.length > 0 && (
                    <button className="quiet small" disabled={suggesting} onClick={suggest}>
                      {t("Others")}
                    </button>
                  )}
                </div>
                {suggesting ? (
                  <div
                    role="status"
                    aria-label={t("Thinking of next steps")}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div className="skel" />
                    <div className="skel" style={{ width: "82%" }} />
                    <div className="skel" style={{ width: "64%" }} />
                  </div>
                ) : head.hooks.length > 0 ? (
                  <div className="suggestions">
                    {head.hooks.map((hook) => (
                      <button key={hook} onClick={() => send(hook)}>
                        {hook}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    className="row"
                    style={{ padding: "12px 14px", border: "1px dashed var(--edge)", borderRadius: 12 }}
                  >
                    <span className="muted grow">{t("No suggestions this time: write your own, or")}</span>
                    <button className="small" onClick={suggest}>
                      {t("Suggest next steps")}
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label htmlFor="act" className="sr">
              {t("What happens next")}
            </label>
            <textarea
              id="act"
              rows={2}
              placeholder={
                busy && !canQueue
                  ? t("You can write the next move once the story is written")
                  : current === "director"
                    ? t("As director: what happens in the world?")
                    : t("What do you do or say next?")
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Not while an input method is still composing: its Enter picks the characters.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <div className="row composer-bar">
              <Menu
                up
                title={`${t("Act as")}: ${actingAs}`}
                label={
                  <>
                    {current === "director" ? (
                      <span className="avatar tiny" aria-hidden="true">
                        <Icon name="pen" size={12} />
                      </span>
                    ) : (
                      <Avatar name={actingAs} me tiny />
                    )}
                    <span className="wide">{actingAs} ▾</span>
                  </>
                }
              >
                {(close) => (
                  <>
                    {groups.map(
                      ([title, people]) =>
                        people.length > 0 && (
                          <div key={title} style={{ display: "flex", flexDirection: "column" }}>
                            <span className="grp">{title}</span>
                            {people.map((c) => (
                              <button
                                type="button"
                                key={c.id}
                                role="menuitemradio"
                                aria-checked={c.id === current}
                                onClick={() => (close(), setActor(c.id))}
                              >
                                <Avatar name={c.name} me={c.id === me} tiny />
                                {c.name}
                                {c.id === me && <span className="muted small">{t("you have been playing")}</span>}
                                {c.gone && <span className="muted small">{t("acting brings them back")}</span>}
                              </button>
                            ))}
                          </div>
                        ),
                    )}
                    <span className="grp">{t("No one in particular")}</span>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={current === "director"}
                      onClick={() => (close(), setActor("director"))}
                    >
                      <span className="avatar tiny" aria-hidden="true">
                        <Icon name="pen" size={12} />
                      </span>
                      {t("Director")}
                      <span className="muted small">{t("change the world directly")}</span>
                    </button>
                  </>
                )}
              </Menu>
              <span className="muted small grow wide">{t("Enter sends · Shift+Enter for a new line")}</span>
              {!busy && head.parentId && resumable(head.parentId) && (
                <button type="button" className="quiet small wide" onClick={() => goTo(head.parentId!)}>
                  {t("Undo last turn")}
                </button>
              )}
              <button className="primary send" type="submit" aria-label={sendLabel} disabled={busy && !canQueue}>
                <span className="wide">{sendLabel}</span>
                <Icon name="arrow" />
              </button>
            </div>
          </form>
        </main>

        {panel && (
          <>
            <div className="scrim" onClick={() => setPanel(null)} aria-hidden="true" />
            <aside className="dock" aria-label={t("Panels")} ref={panelRef}>
              <div className="panel-head">
                {panel === "interview" && guestCharacter ? (
                  <span className="row" style={{ fontWeight: 600 }}>
                    <Avatar name={guestCharacter.name} />
                    {t("Interview")} · {guestCharacter.name}
                  </span>
                ) : (
                  <div
                    className="tabs"
                    role="tablist"
                    aria-label={t("Panels")}
                    onKeyDown={(e) => {
                      // Arrows, Home and End move between the tabs, and the focus goes with them.
                      const order: Panel[] = path.length > 1 ? ["world", "history", "settings"] : ["world", "settings"];
                      const at = order.indexOf(panel);
                      const to =
                        e.key === "ArrowRight"
                          ? (at + 1) % order.length
                          : e.key === "ArrowLeft"
                            ? (at - 1 + order.length) % order.length
                            : e.key === "Home"
                              ? 0
                              : e.key === "End"
                                ? order.length - 1
                                : null;
                      if (to === null) return;
                      e.preventDefault();
                      setPanel(order[to]!);
                      requestAnimationFrame(() => document.getElementById(`tab-${order[to]}`)?.focus());
                    }}
                  >
                    {(
                      [
                        ["world", t("World")],
                        ...(path.length > 1 ? [["history", t("Story so far")]] : []),
                        ["settings", t("Settings")],
                      ] as [Panel, string][]
                    ).map(([name, text]) => (
                      <button
                        key={name}
                        id={`tab-${name}`}
                        role="tab"
                        aria-selected={panel === name}
                        aria-controls="panel-body"
                        tabIndex={panel === name ? 0 : -1}
                        onClick={() => setPanel(name)}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}
                {/* On phones the novel opens from here: the top bar keeps only the essentials. */}
                {path.length > 1 && panel !== "interview" && (
                  <button className="quiet small narrow-only" onClick={() => setNovelOpen(true)}>
                    <Icon name="book" />
                    {t("Novel")}
                  </button>
                )}
                <button
                  className="quiet small"
                  aria-label={panel === "interview" ? t("End the interview") : t("Close the panel")}
                  onClick={() => setPanel(panel === "interview" ? "world" : null)}
                >
                  <Icon name="close" />
                </button>
              </div>
              <div role="tabpanel" id="panel-body" aria-labelledby={panel === "interview" ? undefined : `tab-${panel}`}>
                {panel === "world" && (
                  <WorldPanel
                    state={state}
                    me={me}
                    director={current === "director"}
                    showSecrets={save.settings.showSecrets}
                    onInterview={interview}
                    onMap={() => setMapOpen(true)}
                  />
                )}
                {panel === "history" && (
                  <HistoryPanel
                    path={path}
                    state={state}
                    recall={() => {
                      recall();
                      // The recap shows on the page: a panel lying over it moves aside.
                      if (!isWide) setPanel(null);
                    }}
                    recalling={recap === ""}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    toolsFor={toolsFor}
                  />
                )}
                {panel === "settings" && (
                  <SettingsPanel
                    save={save}
                    worldId={world.id}
                    change={changeSettings}
                    rename={(title) => void api.rename(saveId, title).then(setView, report)}
                    saveNotes={(notes) => api.notes(saveId, notes).then(setView, report)}
                  />
                )}
                {panel === "interview" && guestCharacter && (
                  <InterviewPanel
                    guest={guestCharacter}
                    talk={talk}
                    asking={asking}
                    question={question}
                    setQuestion={setQuestion}
                    ask={askGuest}
                  />
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {renaming && (
        <Ask
          title={t("Name this save")}
          value={save.title}
          onDone={(title) => void api.rename(saveId, title).then(setView, report)}
          onClose={() => setRenaming(false)}
        />
      )}
      {novelOpen && (
        <Novel
          saveId={saveId}
          turns={path.length - 1}
          kept={Array.from({ length: Math.ceil((path.length - 1) / 10) }, (_, n) => path[(n + 1) * 10]?.chapter)}
          name={`${world.title} · ${save.title}`}
          onClose={() => {
            setNovelOpen(false);
            void load(); // the chapters it kept come back with the turns
          }}
        />
      )}
      {mapOpen && <Graph state={state} me={me} onClose={() => setMapOpen(false)} />}
    </div>
  );
}

const sepFor = (text: string) => (lang === "zh" ? `：${text}` : `: ${text}`);
