import { useEffect, useState } from "react";
import type { Character, Fact, Place, Thread, WorldDraft, WorldState } from "../../shared/types.ts";
import { api } from "./api.ts";
import { lang, t } from "./i18n.ts";

const sep = lang === "zh" ? "：" : ": ";
const id = (prefix: string) => `${prefix}${crypto.randomUUID().slice(0, 8)}`;

const emptyDraft = (): WorldDraft => ({
  title: "",
  premise: "",
  opening: "",
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
  const [working, setWorking] = useState(false);
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
  const bringBack = async () => {
    setWorking(true);
    try {
      setProposal(await api.importDraft(pasted));
      setStatus("");
    } catch (error) {
      setStatus(t((error as Error).message));
    } finally {
      setWorking(false);
    }
  };

  const ask = async (revise: boolean) => {
    setWorking(true);
    setStatus("");
    try {
      setProposal(await api.draft(idea, revise ? proposal : null, revise ? feedback : ""));
      setFeedback("");
    } catch (error) {
      setStatus(t((error as Error).message));
    } finally {
      setWorking(false);
    }
  };
  const p = proposal?.state;
  const placeName = (id: string | null) => p?.places.find((x) => x.id === id)?.name;
  const charName = (id: string) => p?.characters.find((c) => c.id === id)?.name ?? "?";

  return (
    <section className="panel ai-draft">
      <h2>{t("Let the AI build a world")}</h2>
      <p className="small muted">{t("Answer what you like; the AI fills in the rest.")}</p>
      {QUESTIONS.map((q, i) => (
        <label key={q.key}>
          {t(q.key)}
          {i === 0 ? (
            <textarea rows={2} value={answers[i]} onChange={(e) => answer(i, e.target.value)} />
          ) : (
            <input value={answers[i]} onChange={(e) => answer(i, e.target.value)} />
          )}
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
      ))}
      <div className="row">
        <button className="primary" disabled={!answers[0]!.trim() || working} onClick={() => ask(false)}>
          {proposal ? t("Start over") : t("Build it")}
        </button>
        <button className="link" disabled={!answers[0]!.trim() || working} onClick={elsewhere}>
          {t("Use your own AI instead (it can search the web)")}
        </button>
        {working && <span className="muted small">{t("The AI is thinking it up… (a few minutes)")}</span>}
      </div>
      {pasting && (
        <label>
          {t("Paste your AI's reply here")}
          <textarea rows={4} value={pasted} onChange={(e) => setPasted(e.target.value)} />
          <button disabled={!pasted.trim() || working} onClick={bringBack}>
            {t("Bring it in")}
          </button>
        </label>
      )}

      {proposal && p && (
        <div className="proposal">
          <h3>{proposal.title}</h3>
          <p>{proposal.premise}</p>
          <p className="muted">
            {t("Opening")}
            {sep}
            {proposal.opening}
          </p>
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
          <p className="small muted">{t("The AI buries its own secrets when you start playing.")}</p>

          <div className="row">
            <button
              className="primary"
              disabled={working}
              onClick={() => {
                onFill(proposal);
                setStatus(t("Filled in below. Look it over, change anything, then save."));
              }}
            >
              {t("Fill in the editor")}
            </button>
          </div>
          <label>
            {t("Want something changed?")}
            <textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </label>
          <button disabled={!feedback.trim() || working} onClick={() => ask(true)}>
            {t("Ask the AI to change it")}
          </button>
        </div>
      )}
      {status && <p className="muted small">{status}</p>}
    </section>
  );
}

export function Studio({ worldId }: { worldId: string | null }) {
  const [draft, setDraft] = useState<WorldDraft | null>(worldId ? null : emptyDraft());
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (worldId) api.world(worldId).then(setDraft, (e: Error) => setStatus(e.message));
  }, [worldId]);
  if (!draft) return <main className="page">{status || t("Loading…")}</main>;

  const s = draft.state;
  const set = (patch: Partial<WorldDraft>) => setDraft({ ...draft, ...patch });
  const setState = (patch: Partial<WorldState>) => setDraft({ ...draft, state: { ...s, ...patch } });
  const update = <T extends { id: string }>(items: T[], itemId: string, patch: Partial<T>) =>
    items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));

  const save = async (andPlay: boolean) => {
    try {
      const world = worldId ? await api.updateWorld(worldId, draft) : await api.createWorld(draft);
      if (andPlay) {
        const started = await api.startSave(world.id, new Date().toLocaleString());
        location.hash = `#/play/${started.id}`;
      } else if (!worldId) location.hash = `#/studio/${world.id}`;
      else setStatus(t("Saved"));
    } catch (error) {
      setStatus((error as Error).message);
    }
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
  const toggleKnows = (c: Character, factId: string) =>
    setState({
      characters: update(s.characters, c.id, {
        knows: c.knows.includes(factId) ? c.knows.filter((k) => k !== factId) : [...c.knows, factId],
      }),
    });

  return (
    <main className="page narrow">
      <header className="bar">
        <a href="#/">← {t("Home")}</a>
        <span className="muted">{t("World studio")}</span>
      </header>

      {!worldId && (
        <AiDraft
          onFill={(filled) => {
            const empty = !draft.title && !draft.premise && !draft.opening && s.characters.length === 0;
            if (empty || confirm(t("Replace what is in the editor?"))) setDraft(filled);
          }}
        />
      )}

      <section className="panel">
        <label>
          {t("Title")}
          <input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <label>
          {t("Premise")}
          <textarea rows={3} value={draft.premise} onChange={(e) => set({ premise: e.target.value })} />
        </label>
        <label>
          {t("Opening")}
          <textarea rows={4} value={draft.opening} onChange={(e) => set({ opening: e.target.value })} />
        </label>
        <label>
          {t("Time in the world")}
          <input value={s.clock} onChange={(e) => setState({ clock: e.target.value })} />
        </label>
      </section>

      <section className="panel">
        <h2>{t("Places")}</h2>
        {s.places.map((p) => (
          <div className="item" key={p.id}>
            <input
              aria-label={t("Name")}
              placeholder={t("Name")}
              value={p.name}
              onChange={(e) => setState({ places: update(s.places, p.id, { name: e.target.value }) })}
            />
            <textarea
              aria-label={t("Description")}
              placeholder={t("Description")}
              rows={2}
              value={p.description}
              onChange={(e) => setState({ places: update(s.places, p.id, { description: e.target.value }) })}
            />
            <button className="link danger" onClick={() => removePlace(p)}>
              {t("Remove")}
            </button>
          </div>
        ))}
        <button onClick={() => setState({ places: [...s.places, { id: id("p"), name: "", description: "" }] })}>
          {t("Add place")}
        </button>
      </section>

      <section className="panel">
        <h2>{t("Characters")}</h2>
        {s.characters.map((c) => (
          <div className="item" key={c.id}>
            <input
              aria-label={t("Name")}
              placeholder={t("Name")}
              value={c.name}
              onChange={(e) => setState({ characters: update(s.characters, c.id, { name: e.target.value }) })}
            />
            <textarea
              aria-label={t("Persona")}
              placeholder={t("Persona")}
              rows={2}
              value={c.persona}
              onChange={(e) => setState({ characters: update(s.characters, c.id, { persona: e.target.value }) })}
            />
            <textarea
              aria-label={t("Goals")}
              placeholder={t("Goals")}
              rows={2}
              value={c.goals}
              onChange={(e) => setState({ characters: update(s.characters, c.id, { goals: e.target.value }) })}
            />
            <label>
              {t("Starts at")}
              <select
                value={c.placeId ?? ""}
                onChange={(e) =>
                  setState({ characters: update(s.characters, c.id, { placeId: e.target.value || null }) })
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
            {s.facts.length > 0 && (
              <fieldset>
                <legend>{t("Knows")}</legend>
                {s.facts.map((f) => (
                  <label className="check" key={f.id}>
                    <input type="checkbox" checked={c.knows.includes(f.id)} onChange={() => toggleKnows(c, f.id)} />
                    {f.text || "…"}
                  </label>
                ))}
              </fieldset>
            )}
            <button
              className="link danger"
              onClick={() =>
                setState({
                  characters: s.characters.filter((x) => x.id !== c.id),
                  relationships: s.relationships.filter((r) => r.a !== c.id && r.b !== c.id),
                })
              }
            >
              {t("Remove")}
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setState({
              characters: [
                ...s.characters,
                { id: id("c"), name: "", persona: "", goals: "", placeId: s.places[0]?.id ?? null, notes: "", knows: [] },
              ],
            })
          }
        >
          {t("Add character")}
        </button>
      </section>

      <section className="panel">
        <h2>{t("Facts and secrets")}</h2>
        {s.facts.map((f) => (
          <div className="item" key={f.id}>
            <textarea
              rows={2}
              value={f.text}
              onChange={(e) => setState({ facts: update(s.facts, f.id, { text: e.target.value }) })}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={f.secret}
                onChange={(e) => setState({ facts: update(s.facts, f.id, { secret: e.target.checked }) })}
              />
              {t("Secret (hidden from the player until discovered)")}
            </label>
            <button className="link danger" onClick={() => removeFact(f)}>
              {t("Remove")}
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setState({
              facts: [...s.facts, { id: id("f"), text: "", secret: false, revealed: false, source: "author" }],
            })
          }
        >
          {t("Add fact")}
        </button>
      </section>

      <section className="panel">
        <h2>{t("Open questions")}</h2>
        {s.threads.map((th: Thread) => (
          <div className="item row" key={th.id}>
            <input
              value={th.title}
              onChange={(e) => setState({ threads: update(s.threads, th.id, { title: e.target.value }) })}
            />
            <button className="link danger" onClick={() => setState({ threads: s.threads.filter((x) => x.id !== th.id) })}>
              {t("Remove")}
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setState({ threads: [...s.threads, { id: id("t"), title: "", resolved: false, resolution: "" }] })
          }
        >
          {t("Add question")}
        </button>
      </section>

      <div className="row sticky">
        <button onClick={() => save(false)}>{t("Save")}</button>
        <button className="primary" onClick={() => save(true)}>
          {t("Save and play")}
        </button>
        <span className="muted">{status}</span>
      </div>
    </main>
  );
}
