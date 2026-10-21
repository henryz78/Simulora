import { useEffect, useRef, useState } from "react";
import type { Character, Fact, Place, WorldDraft, WorldState } from "../../shared/types.ts";
import { api } from "./api.ts";
import { lang, t } from "./i18n.ts";
import { Avatar, Confirm, Elapsed, Icon, LookButton, nextSaveName } from "./ui.tsx";

const sep = lang === "zh" ? "：" : ": ";
const id = (prefix: string) => `${prefix}${crypto.randomUUID().slice(0, 8)}`;

const emptyDraft = (): WorldDraft => ({
  title: "",
  premise: "",
  rules: "",
  opening: "",
  tags: [],
  state: { clock: "", places: [], characters: [], facts: [], threads: [], relationships: [] },
});

/** A few questions instead of one empty box; only the first must be answered (the player, 2026-10-18). */
const QUESTIONS = [
  { key: "What story do you want to play? A sentence is enough.", chips: [] },
  { key: "When and where?", chips: ["Ancient China", "Republic era", "Today", "The future", "A fantasy world"] },
  { key: "What mood?", chips: ["Mystery", "Warm", "Adventure", "Light-hearted", "Epic", "Everyday life"] },
  { key: "Who do you want to play?", chips: [] },
  { key: "What is the main conflict?", chips: [] },
  { key: "Anyone you want in it?", chips: [] },
  { key: "A work or style to follow?", chips: [] },
  { key: "How big a world?", chips: ["Small: one place, a few people", "Middling", "Large: travel far"] },
];

/** Answer a few questions, get a proposal (here or from another AI), ask for changes, then fill the editor. */
function AiDraft({ onFill }: { onFill: (draft: WorldDraft) => void }) {
  const [answers, setAnswers] = useState<string[]>(QUESTIONS.map(() => ""));
  const [feedback, setFeedback] = useState("");
  const [proposal, setProposal] = useState<WorldDraft | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const idea = QUESTIONS.map((q, i) => (answers[i]!.trim() ? `${t(q.key)} ${answers[i]!.trim()}` : ""))
    .filter(Boolean)
    .join("\n");
  const answer = (i: number, value: string) => setAnswers((a) => a.map((x, j) => (j === i ? value : x)));
  const elsewhere = async () => {
    try {
      await navigator.clipboard.writeText((await api.draftPrompt(idea)).prompt);
      setPasting(true);
      setStatus(t("Copied. Paste it into your AI, talk it over there, then paste its reply below."));
    } catch (error) {
      setStatus(t((error as Error).message));
    }
  };
  const run = async (job: () => Promise<WorldDraft>) => {
    setWorking(Date.now());
    setStatus("");
    try {
      setProposal(await job());
      setFeedback("");
    } catch (error) {
      setStatus(t((error as Error).message));
    } finally {
      setWorking(null);
    }
  };
  const p = proposal?.state;
  const placeName = (pid: string | null) => p?.places.find((x) => x.id === pid)?.name;
  const charName = (cid: string) => p?.characters.find((c) => c.id === cid)?.name ?? "?";

  return (
    <>
      <section className="s-card" aria-labelledby="ask">
        <h2 id="ask">{t("Tell us the story you want to play")}</h2>
        <label>
          <b>{t(QUESTIONS[0]!.key)}</b>
          <span className="hint">{t("Only this one must be answered; the AI fills in the rest.")}</span>
          <textarea rows={3} className="serif" value={answers[0]} onChange={(e) => answer(0, e.target.value)} />
        </label>
        <div className="s-grid">
          {QUESTIONS.slice(1).map((q, j) => {
            const i = j + 1;
            return (
              <label key={q.key}>
                {t(q.key)}
                <input value={answers[i]} onChange={(e) => answer(i, e.target.value)} />
                {q.chips.length > 0 && (
                  <span className="chips">
                    {q.chips.map((chip) => (
                      <button type="button" key={chip} className="chip" onClick={() => answer(i, t(chip))}>
                        {t(chip)}
                      </button>
                    ))}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <div className="row">
          <button
            className="primary"
            disabled={!answers[0]!.trim() || working !== null}
            onClick={() => run(() => api.draft(idea, null, ""))}
          >
            {proposal ? t("Start over") : t("Build the world")}
          </button>
          <button className="quiet" disabled={!answers[0]!.trim() || working !== null} onClick={elsewhere}>
            {t("Use your own AI instead (it can search the web)")}
          </button>
        </div>
        {working !== null && (
          <p className="muted small" role="status">
            {t("The AI is thinking it up… (a few minutes)")} · <Elapsed since={working} />
          </p>
        )}
        {pasting && (
          <label>
            {t("Paste your AI's reply here")}
            <textarea rows={4} value={pasted} onChange={(e) => setPasted(e.target.value)} />
            <span>
              <button disabled={!pasted.trim() || working !== null} onClick={() => run(() => api.importDraft(pasted))}>
                {t("Bring it in")}
              </button>
            </span>
          </label>
        )}
        {status && (
          <p className="small muted" role="status">
            {status}
          </p>
        )}
      </section>

      {proposal && p && (
        <section className="s-card proposal" aria-labelledby="proposal">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="hint">{t("The AI's proposal")}</span>
            <button
              className="quiet small"
              disabled={working !== null}
              onClick={() => run(() => api.draft(idea, null, ""))}
            >
              {t("Build another")}
            </button>
          </div>
          <h2 id="proposal" style={{ fontSize: 28 }}>
            {proposal.title}
          </h2>
          <p className="serif" style={{ fontSize: 16, lineHeight: 1.8 }}>
            {proposal.premise}
          </p>
          <div className="row" style={{ gap: 6 }}>
            {p.characters.slice(0, 5).map((c, i) => (
              <span className="pill" key={c.id}>
                <Avatar name={c.name} me={i === 0} />
                {c.name}
                {i === 0 && <span className="hint">{t("lead")}</span>}
              </span>
            ))}
            {p.characters.length > 5 && <span className="hint">+ {p.characters.length - 5}</span>}
          </div>
          <span className="hint">
            {t("Places")} · {p.places.map((x) => x.name).join(" · ")}
          </span>
          <div className="note">
            <span className="hint">{t("Opening")}</span>
            <p className="serif" style={{ fontSize: 15, lineHeight: 1.8 }}>
              {proposal.opening}
            </p>
          </div>
          <details>
            <summary>{t("See the whole proposal")}</summary>
            <div className="s-full">
              <h4>{t("Characters")}</h4>
              <ul>
                {p.characters.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong>
                    {placeName(c.placeId) && <span className="muted"> · {placeName(c.placeId)}</span>}
                    <div className="small">{c.persona}</div>
                    {c.goals && (
                      <div className="small muted">
                        {t("Goals")}
                        {sep}
                        {c.goals}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <h4>{t("Places")}</h4>
              <ul>
                {p.places.map((x) => (
                  <li key={x.id}>
                    <strong>{x.name}</strong> <span className="small muted">{x.description}</span>
                  </li>
                ))}
              </ul>
              {proposal.rules && (
                <>
                  <h4>{t("Rules for the storyteller")}</h4>
                  <p className="small" style={{ whiteSpace: "pre-wrap" }}>
                    {proposal.rules}
                  </p>
                </>
              )}
              {p.facts.length > 0 && (
                <>
                  <h4>{t("Known facts")}</h4>
                  <ul>
                    {p.facts.map((f) => (
                      <li key={f.id}>{f.text}</li>
                    ))}
                  </ul>
                </>
              )}
              {p.threads.length > 0 && (
                <>
                  <h4>{t("Open questions")}</h4>
                  <ul>
                    {p.threads.map((th) => (
                      <li key={th.id}>{th.title}</li>
                    ))}
                  </ul>
                </>
              )}
              {p.relationships.length > 0 && (
                <>
                  <h4>{t("Relationships")}</h4>
                  <ul>
                    {p.relationships.map((r) => (
                      <li key={`${r.a}-${r.b}`}>
                        {charName(r.a)} · {charName(r.b)}
                        {sep}
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </details>
          <span className="hint">{t("The AI buries its own secrets when you start playing.")}</span>
          <div className="row">
            <button className="primary" disabled={working !== null} onClick={() => onFill(proposal)}>
              {t("Use this, and look it over in the editor")}
            </button>
          </div>
          <form
            className="row"
            style={{ flexWrap: "nowrap", paddingTop: 14, borderTop: "1px solid var(--line)" }}
            onSubmit={(e) => {
              e.preventDefault();
              if (feedback.trim()) void run(() => api.draft(idea, proposal, feedback));
            }}
          >
            <label htmlFor="change" className="sr">
              {t("Want something changed?")}
            </label>
            <input
              id="change"
              value={feedback}
              placeholder={t("Want something changed? For example: make the lead a Gryffindor")}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button type="submit" disabled={!feedback.trim() || working !== null}>
              {t("Ask the AI to change it")}
            </button>
          </form>
        </section>
      )}
    </>
  );
}

type Asking =
  | { kind: "character"; character: Character }
  | { kind: "place"; place: Place; starting: number }
  | { kind: "replace"; draft: WorldDraft }
  | { kind: "leave"; href: string };

export function Studio({ worldId, manual = false }: { worldId: string | null; manual?: boolean }) {
  const [draft, setDraft] = useState<WorldDraft | null>(worldId ? null : emptyDraft());
  // What was last loaded or saved: the editor is "changed" when it differs.
  const [saved, setSaved] = useState(() => JSON.stringify(emptyDraft()));
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  // A new world: built with the AI, or written from the start.
  const [mode, setMode] = useState<"ai" | "manual" | "filled">(manual ? "manual" : "ai");
  const [open, setOpen] = useState<string | null>(null);
  const [tagText, setTagText] = useState<string | null>(null);
  // A new world once created: a second save updates it rather than making another.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const editorTop = useRef<HTMLDivElement>(null);
  useEffect(() => void (document.title = `${t("World studio")} · Simulora`), []);
  useEffect(() => {
    if (worldId)
      api.world(worldId).then(
        (w) => {
          // Everything the author can change, tags and the sample it came from included.
          const { id, createdAt, updatedAt, ...rest } = w;
          const loaded = { ...rest, tags: w.tags ?? [] };
          setDraft(loaded);
          setSaved(JSON.stringify(loaded));
        },
        (e: Error) => setStatus({ text: t(e.message), error: true }),
      );
  }, [worldId]);
  const changed = draft !== null && JSON.stringify(draft) !== saved;
  // Leaving with changes not saved asks first.
  useEffect(() => {
    if (!changed) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [changed]);
  if (!draft)
    return (
      <main className="home">
        {status ? <p className="error">{status.text}</p> : <p className="muted">{t("Loading…")}</p>}
      </main>
    );

  const s = draft.state;
  const set = (patch: Partial<WorldDraft>) => setDraft({ ...draft, ...patch });
  const setState = (patch: Partial<WorldState>) => setDraft({ ...draft, state: { ...s, ...patch } });
  const update = <T extends { id: string }>(items: T[], itemId: string, patch: Partial<T>) =>
    items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
  // The editor shows for a world being edited, one written by hand, or once anything is in it.
  const editing = worldId !== null || mode !== "ai" || JSON.stringify(draft) !== JSON.stringify(emptyDraft());

  const save = async (andPlay: boolean) => {
    setSaving(true);
    setStatus(null);
    try {
      const target = worldId ?? createdId;
      const world = target ? await api.updateWorld(target, draft) : await api.createWorld(draft);
      setCreatedId(world.id);
      setSaved(JSON.stringify(draft));
      if (andPlay) {
        const saves = (await api.worlds()).find((x) => x.world.id === world.id)?.saves ?? [];
        const started = await api.startSave(world.id, nextSaveName(saves));
        location.hash = `#/play/${started.id}`;
      } else if (!worldId) location.hash = `#/studio/${world.id}`;
      else setStatus({ text: t("Saved") });
    } catch (error) {
      setStatus({ text: t((error as Error).message), error: true });
    } finally {
      setSaving(false);
    }
  };
  const fill = (filled: WorldDraft) => {
    // The AI's world has no tags of its own: the author's stay, as does the sample it came from.
    setDraft({ ...filled, tags: draft?.tags ?? [], ...(draft?.from ? { from: draft.from } : {}) });
    setMode("filled");
    requestAnimationFrame(() => editorTop.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  const removePlace = (place: Place) =>
    setState({
      places: s.places.filter((p) => p.id !== place.id),
      characters: s.characters.map((c) => (c.placeId === place.id ? { ...c, placeId: null } : c)),
    });
  const removeFact = (fact: Fact) =>
    setState({
      facts: s.facts.filter((f) => f.id !== fact.id),
      characters: s.characters.map((c) => ({ ...c, knows: c.knows.filter((k) => k !== fact.id) })),
    });
  const removeCharacter = (c: Character) =>
    setState({
      characters: s.characters.filter((x) => x.id !== c.id),
      relationships: s.relationships.filter((r) => r.a !== c.id && r.b !== c.id),
    });
  const toggleKnows = (c: Character, factId: string) =>
    setState({
      characters: update(s.characters, c.id, {
        knows: c.knows.includes(factId) ? c.knows.filter((k) => k !== factId) : [...c.knows, factId],
      }),
    });
  const charName = (cid: string) => s.characters.find((c) => c.id === cid)?.name || "…";
  const secrets = s.facts.filter((f) => f.secret).length;
  const sections = [
    ["studio-basics", t("Basics"), ""],
    ["studio-rules", t("Rules for the storyteller"), draft.rules?.trim() ? t("written") : ""],
    ["studio-characters", t("Characters"), String(s.characters.length)],
    ["studio-places", t("Places"), String(s.places.length)],
    [
      "studio-facts",
      t("Facts and secrets"),
      secrets ? `${s.facts.length} · ${t("secrets")} ${secrets}` : String(s.facts.length),
    ],
    ["studio-threads", t("Open questions"), String(s.threads.length)],
  ] as const;
  const jump = (to: string) => document.getElementById(to)?.scrollIntoView({ block: "start", behavior: "smooth" });

  const saveButtons = (
    <>
      <button disabled={saving || !draft.title.trim() || (!changed && worldId !== null)} onClick={() => save(false)}>
        {t("Save")}
      </button>
      <button className="primary" disabled={saving || !draft.title.trim()} onClick={() => save(true)}>
        {t("Save and play")}
      </button>
    </>
  );

  return (
    <div className="studio">
      <header
        className="topbar"
        // Leaving by a link with changes not saved asks first (closing or reloading the tab asks the browser's way).
        onClickCapture={(e) => {
          const link = (e.target as Element).closest("a[href^='#']");
          if (!changed || !link) return;
          e.preventDefault();
          setAsking({ kind: "leave", href: link.getAttribute("href")! });
        }}
      >
        <a href="#/" className="seal" aria-label={t("Home")}>
          <img src="/favicon.png" alt="" />
        </a>
        <nav className="crumbs" aria-label={t("Where you are")}>
          <a href="#/create" className="muted wide" style={{ fontFamily: "var(--sans)", fontWeight: 400, fontSize: 14 }}>
            {t("Create")}
          </a>
          <span className="muted wide">/</span>
          {worldId ? (
            <a href={`#/world/${worldId}`}>{draft.title || "…"}</a>
          ) : (
            <span className="serif">{t("New world")}</span>
          )}
          {worldId && <span className="muted small">· {t("Editing")}</span>}
        </nav>
        {(changed || status) && (
          <span className={!changed && status?.error ? "error small" : "muted small"} role="status">
            {changed ? `● ${t("Changes not saved")}` : status!.text}
          </span>
        )}
        {editing && <span className="row wide">{saveButtons}</span>}
        <LookButton />
      </header>

      <div className="studio-body">
        {editing && (
          <nav className="studio-toc" aria-label={t("Sections")}>
            {sections.map(([to, label, count]) => (
              <button key={to} className="quiet small" onClick={() => jump(to)}>
                {label}
                <span className="muted">{count}</span>
              </button>
            ))}
            <p className="hint">
              {t("The title, premise and rules change every save at once; people, places and facts are for new saves.")}
            </p>
          </nav>
        )}

        <main className="studio-main">
          {!worldId && (
            <div className="row" style={{ gap: 14, alignItems: "stretch" }}>
              <button className="choice" aria-pressed={mode !== "manual"} onClick={() => setMode("ai")}>
                <b>{t("Let the AI build it")}</b>
                <span className="hint">
                  {t("Answer a few questions; the AI proposes the whole world: people, places, an opening.")}
                </span>
              </button>
              <button className="choice" aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>
                <b>{t("Write it yourself")}</b>
                <span className="hint">{t("Write the title, premise, people and places in the editor.")}</span>
              </button>
            </div>
          )}

          {/* Kept while hidden: switching back finds the answers and the proposal as they were. */}
          {!worldId && (
            <div hidden={mode === "manual"}>
              <AiDraft
                onFill={(filled) => {
                  const empty = !draft.title && !draft.premise && !draft.opening && s.characters.length === 0;
                  if (empty) fill(filled);
                  else setAsking({ kind: "replace", draft: filled });
                }}
              />
            </div>
          )}

          {editing && (
            <>
              <div ref={editorTop} className="editor-top" />
              <div className="studio-jump">
                <label htmlFor="jump" className="sr">
                  {t("Go to")}
                </label>
                <select id="jump" value="" onChange={(e) => e.target.value && jump(e.target.value)}>
                  <option value="">{t("Go to…")}</option>
                  {sections.map(([to, label, count]) => (
                    <option key={to} value={to}>
                      {label} {count}
                    </option>
                  ))}
                </select>
              </div>
              {mode === "filled" && (
                <p className="note small">
                  {t("Filled in from the AI's proposal. Look it over, change anything, then save.")}
                </p>
              )}

              <section className="s-card" id="studio-basics" aria-labelledby="h-basics">
                <h2 id="h-basics">{t("Basics")}</h2>
                <label>
                  {t("Title")}
                  <input
                    className="serif"
                    style={{ fontSize: 20, fontWeight: 600 }}
                    value={draft.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                </label>
                <label>
                  {t("Tags")}
                  <span className="hint">{t("Genre and mood, apart by spaces, e.g. mystery wuxia: for finding it on Explore.")}</span>
                  <input
                    value={tagText ?? (draft.tags ?? []).join(" ")}
                    onChange={(e) => {
                      // The text as typed, spaces included; the tags as the server keeps them.
                      setTagText(e.target.value);
                      set({ tags: [...new Set(e.target.value.split(/[\s,，、]+/).filter(Boolean).map((x) => x.slice(0, 12)))].slice(0, 8) });
                    }}
                  />
                </label>
                <label>
                  {t("Premise")}
                  <span className="hint">{t("A paragraph or two: what this world is, and how things stand.")}</span>
                  <textarea rows={3} value={draft.premise} onChange={(e) => set({ premise: e.target.value })} />
                </label>
                <label>
                  {t("Opening")}
                  <span className="hint">
                    {t("What is read before the first turn: it puts the lead into the story.")}
                  </span>
                  <textarea
                    rows={4}
                    className="serif"
                    style={{ fontSize: 15 }}
                    value={draft.opening}
                    onChange={(e) => set({ opening: e.target.value })}
                  />
                </label>
                <label style={{ maxWidth: 420 }}>
                  {t("Time in the world")}
                  <input value={s.clock} onChange={(e) => setState({ clock: e.target.value })} />
                </label>
              </section>

              <section className="s-card" id="studio-rules" aria-labelledby="h-rules">
                <h2 id="h-rules">{t("Rules for the storyteller")}</h2>
                <label>
                  <span className="hint">
                    {t("(tone, how magic or fighting works, what things cost; the AI follows them every turn)")}
                  </span>
                  <textarea rows={5} value={draft.rules ?? ""} onChange={(e) => set({ rules: e.target.value })} />
                </label>
                <span className="hint">
                  {t("Where they clash with the player's settings (length, voice, writing style), the settings win.")}
                </span>
              </section>

              <section className="s-card" id="studio-characters" aria-labelledby="h-characters">
                <h2 id="h-characters">
                  {t("Characters")} <span className="muted small">{s.characters.length}</span>
                </h2>
                <span className="hint">
                  {t("The first one is who the player starts as; they can switch to anyone, or to director.")}
                </span>
                {s.characters.map((c, i) => {
                  const expanded = open === c.id;
                  const ties = s.relationships.filter((r) => r.a === c.id || r.b === c.id);
                  return (
                    <div className="person-card" key={c.id}>
                      <button
                        className="person-head"
                        aria-expanded={expanded}
                        aria-controls={expanded ? `body-${c.id}` : undefined}
                        onClick={() => setOpen(expanded ? null : c.id)}
                      >
                        <Avatar name={c.name || "?"} me={i === 0} />
                        <span className="grow" style={{ textAlign: "left" }}>
                          <b>{c.name || t("Unnamed")}</b> {i === 0 && <span className="badge plain">{t("lead")}</span>}
                          <span className="snippet">{c.persona}</span>
                        </span>
                        <span className="muted small wide">
                          {s.places.find((p) => p.id === c.placeId)?.name ?? t("Nowhere")}
                        </span>
                        <span className="muted" aria-hidden="true">
                          {expanded ? "▴" : "▾"}
                        </span>
                      </button>
                      {expanded && (
                        <div className="person-body" id={`body-${c.id}`}>
                          <div className="row" style={{ alignItems: "flex-start" }}>
                            <label style={{ flex: "1 1 220px" }}>
                              {t("Name")}
                              <input
                                value={c.name}
                                onChange={(e) =>
                                  setState({ characters: update(s.characters, c.id, { name: e.target.value }) })
                                }
                              />
                            </label>
                            <label style={{ flex: "1 1 220px" }}>
                              {t("Starts at")}
                              <select
                                value={c.placeId ?? ""}
                                onChange={(e) =>
                                  setState({
                                    characters: update(s.characters, c.id, { placeId: e.target.value || null }),
                                  })
                                }
                              >
                                <option value="">{t("Nowhere")}</option>
                                {s.places.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name || "…"}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label>
                            {t("Persona")}
                            <textarea
                              rows={3}
                              value={c.persona}
                              onChange={(e) =>
                                setState({ characters: update(s.characters, c.id, { persona: e.target.value }) })
                              }
                            />
                          </label>
                          <label>
                            {t("Goals")}
                            <textarea
                              rows={2}
                              value={c.goals}
                              onChange={(e) =>
                                setState({ characters: update(s.characters, c.id, { goals: e.target.value }) })
                              }
                            />
                          </label>
                          {s.facts.length > 0 && (
                            <div className="field" role="group" aria-labelledby={`knows-${c.id}`}>
                              <span id={`knows-${c.id}`}>{t("What they know")}</span>
                              <span className="hint">
                                {t(
                                  "Tap to switch. Purple is a secret: they know it, the player does not until it comes out.",
                                )}
                              </span>
                              <div className="chips">
                                {s.facts.map((f) => (
                                  <button
                                    type="button"
                                    key={f.id}
                                    className={f.secret ? "chip secret" : "chip"}
                                    aria-pressed={c.knows.includes(f.id)}
                                    title={f.text}
                                    aria-label={`${f.secret ? `${t("Secret")}${sep}` : ""}${f.text}`}
                                    onClick={() => toggleKnows(c, f.id)}
                                  >
                                    {f.secret && <Icon name="lock" size={13} />}
                                    {(f.text || "…").slice(0, 24)}
                                    {f.text.length > 24 && "…"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {ties.length > 0 && (
                            <div className="field" role="group" aria-labelledby={`ties-${c.id}`}>
                              <span id={`ties-${c.id}`}>{t("Relationships")}</span>
                              {ties.map((r) => (
                                <span key={`${r.a}-${r.b}`} className="small">
                                  <b style={{ fontWeight: 600 }}>{charName(r.a === c.id ? r.b : r.a)}</b> · {r.text}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="row">
                            {i > 0 && (
                              <button
                                className="small"
                                onClick={() =>
                                  setState({ characters: [c, ...s.characters.filter((x) => x.id !== c.id)] })
                                }
                              >
                                {t("Make them the lead")}
                              </button>
                            )}
                            <span className="grow" />
                            <button
                              className="quiet small danger-text"
                              onClick={() => setAsking({ kind: "character", character: c })}
                            >
                              {t("Delete this character")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div>
                  <button
                    onClick={() => {
                      const created = id("c");
                      setState({
                        characters: [
                          ...s.characters,
                          {
                            id: created,
                            name: "",
                            persona: "",
                            goals: "",
                            placeId: s.places[0]?.id ?? null,
                            notes: "",
                            knows: [],
                          },
                        ],
                      });
                      setOpen(created);
                    }}
                  >
                    <Icon name="plus" />
                    {t("Add character")}
                  </button>
                </div>
              </section>

              <section className="s-card" id="studio-places" aria-labelledby="h-places">
                <h2 id="h-places">
                  {t("Places")} <span className="muted small">{s.places.length}</span>
                </h2>
                {s.places.map((p) => {
                  const starting = s.characters.filter((c) => c.placeId === p.id).length;
                  return (
                    <div className="s-item" key={p.id}>
                      <div className="grow" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          aria-label={t("Name")}
                          placeholder={t("Name")}
                          style={{ fontWeight: 600 }}
                          value={p.name}
                          onChange={(e) => setState({ places: update(s.places, p.id, { name: e.target.value }) })}
                        />
                        <textarea
                          aria-label={t("Description")}
                          placeholder={t("Description")}
                          rows={2}
                          value={p.description}
                          onChange={(e) =>
                            setState({ places: update(s.places, p.id, { description: e.target.value }) })
                          }
                        />
                      </div>
                      <div className="s-side">
                        {starting > 0 && (
                          <span className="muted small">
                            {lang === "zh" ? `${starting} 人开局在这` : `${starting} start here`}
                          </span>
                        )}
                        <button
                          className="quiet small danger-text"
                          onClick={() =>
                            starting > 0 ? setAsking({ kind: "place", place: p, starting }) : removePlace(p)
                          }
                        >
                          {t("Delete")}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div>
                  <button
                    onClick={() => setState({ places: [...s.places, { id: id("p"), name: "", description: "" }] })}
                  >
                    <Icon name="plus" />
                    {t("Add place")}
                  </button>
                </div>
              </section>

              <section className="s-card" id="studio-facts" aria-labelledby="h-facts">
                <h2 id="h-facts">
                  {t("Facts and secrets")}{" "}
                  <span className="muted small">
                    {s.facts.length}
                    {secrets > 0 && ` · ${t("secrets")} ${secrets}`}
                  </span>
                </h2>
                <span className="hint">
                  {t("A secret stays hidden from the player until it is found; the AI buries a few more of its own.")}
                </span>
                {s.facts.map((f) => {
                  const knowers = s.characters.filter((c) => c.knows.includes(f.id)).length;
                  return (
                    <div className="s-item" key={f.id}>
                      <textarea
                        aria-label={t("Fact")}
                        rows={2}
                        className={f.secret ? "grow secret-text" : "grow"}
                        value={f.text}
                        onChange={(e) => setState({ facts: update(s.facts, f.id, { text: e.target.value }) })}
                      />
                      <div className="s-side">
                        <button
                          type="button"
                          className="chip secret"
                          aria-pressed={f.secret}
                          onClick={() => setState({ facts: update(s.facts, f.id, { secret: !f.secret }) })}
                        >
                          <Icon name="lock" size={13} />
                          {t("Secret")}
                        </button>
                        {knowers > 0 && (
                          <span className="muted small">{lang === "zh" ? `${knowers} 人知道` : `${knowers} know`}</span>
                        )}
                        <button className="quiet small danger-text" onClick={() => removeFact(f)}>
                          {t("Delete")}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div>
                  <button
                    onClick={() =>
                      setState({
                        facts: [
                          ...s.facts,
                          { id: id("f"), text: "", secret: false, revealed: false, source: "author" },
                        ],
                      })
                    }
                  >
                    <Icon name="plus" />
                    {t("Add fact")}
                  </button>
                </div>
              </section>

              <section className="s-card" id="studio-threads" aria-labelledby="h-threads">
                <h2 id="h-threads">
                  {t("Open questions")} <span className="muted small">{s.threads.length}</span>
                </h2>
                <span className="hint">{t("What the story starts out asking; the AI keeps them in mind.")}</span>
                {s.threads.map((th) => (
                  <div className="s-item" key={th.id}>
                    <input
                      aria-label={t("Open questions")}
                      className="grow"
                      value={th.title}
                      onChange={(e) => setState({ threads: update(s.threads, th.id, { title: e.target.value }) })}
                    />
                    <button
                      className="quiet small danger-text"
                      onClick={() => setState({ threads: s.threads.filter((x) => x.id !== th.id) })}
                    >
                      {t("Delete")}
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    onClick={() =>
                      setState({ threads: [...s.threads, { id: id("t"), title: "", resolved: false, resolution: "" }] })
                    }
                  >
                    <Icon name="plus" />
                    {t("Add question")}
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {editing && <div className="studio-savebar narrow-only">{saveButtons}</div>}

      {asking?.kind === "leave" && (
        <Confirm
          title={t("Leave without saving?")}
          text={t("The changes made here since the last save will be lost.")}
          action={t("Leave without saving")}
          onConfirm={() => {
            setSaved(JSON.stringify(draft));
            location.hash = asking.href;
          }}
          onClose={() => setAsking(null)}
        />
      )}
      {asking?.kind === "replace" && (
        <Confirm
          title={t("Replace what is in the editor?")}
          text={t("The AI's world takes the place of everything in the editor now.")}
          action={t("Replace")}
          onConfirm={() => fill(asking.draft)}
          onClose={() => setAsking(null)}
        />
      )}
      {asking?.kind === "character" && (
        <Confirm
          title={
            lang === "zh"
              ? `删除人物“${asking.character.name || "未命名"}”？`
              : `Delete “${asking.character.name || "unnamed"}”?`
          }
          text={t("Their relationships go with them. Saves already started keep them.")}
          action={t("Delete")}
          onConfirm={() => removeCharacter(asking.character)}
          onClose={() => setAsking(null)}
        />
      )}
      {asking?.kind === "place" && (
        <Confirm
          title={
            lang === "zh"
              ? `删除地点“${asking.place.name || "未命名"}”？`
              : `Delete “${asking.place.name || "unnamed"}”?`
          }
          text={
            lang === "zh"
              ? `${asking.starting} 个人物开局在这里，他们的开局位置会变成“未定”。`
              : `${asking.starting} characters start here; they will start nowhere in particular.`
          }
          action={t("Delete")}
          onConfirm={() => removePlace(asking.place)}
          onClose={() => setAsking(null)}
        />
      )}
    </div>
  );
}
