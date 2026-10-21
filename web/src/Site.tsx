// The site around the game: home, explore, create and mine, under one top bar (a tab bar on phones).
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SampleIntro, SampleSummary, SaveSummary, World } from "../../shared/types.ts";
import { afterSignIn, api, type Me } from "./api.ts";
import { lang, t } from "./i18n.ts";
import { coverOf, Dialog, homeArt, Icon, LookButton, nextSaveName, turnLabel, when } from "./ui.tsx";

type Shelf = { world: World; saves: SaveSummary[] }[];
type Page = "home" | "explore" | "create" | "me";

const PAGES: [Page, string, string, Parameters<typeof Icon>[0]["name"]][] = [
  ["home", "#/", "Home", "home"],
  ["explore", "#/explore", "Explore", "compass"],
  ["create", "#/create", "Create", "pen"],
  ["me", "#/me", "Mine", "user"],
];

/** The frame of every site page: the top bar, the page, and the tab bar on phones. */
export function Site({ page, title, children }: { page: Page; title: string; children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    document.title = title ? `${title} · Simulora` : "Simulora";
  }, [title]);
  // A new page starts at the top, and a screen reader starts reading it.
  useEffect(() => {
    scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, []);
  const links = (icons: boolean) =>
    PAGES.map(([id, href, label, icon]) => (
      <a key={id} href={href} aria-current={id === page ? "page" : undefined}>
        {icons && <Icon name={icon} size={20} />}
        {t(label)}
      </a>
    ));
  return (
    <div className="site">
      <header className="topbar">
        <a href="#/" className="seal" aria-label={t("Home")}>
          拟
        </a>
        <span className="brand">Simulora</span>
        <nav className="site-nav wide" aria-label={t("Site")}>
          {links(false)}
        </nav>
        <span className="grow" />
        <LookButton />
      </header>
      <main className="site-main" ref={main} tabIndex={-1}>
        {children}
      </main>
      <nav className="tabbar narrow-only" aria-label={t("Site")}>
        {links(true)}
      </nav>
    </div>
  );
}

/** Reads the worlds, and the samples when asked, with a retry on failure. */
function useData(samples: boolean) {
  const [worlds, setWorlds] = useState<Shelf | null>(null);
  const [list, setList] = useState<SampleSummary[] | null>(samples ? null : []);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    const fail = (e: Error) => setError(e.message);
    api.worlds().then(setWorlds, fail);
    if (samples) api.samples().then(setList, fail);
  };
  useEffect(load, []);
  const problem = error && (
    <div className="note fail" role="alert">
      <b>{t("Could not read your worlds")}</b>
      <span className="small muted">{t(error)}</span>
      <div>
        <button className="small" onClick={load}>
          {t("Retry")}
        </button>
      </div>
    </div>
  );
  const loading = !error && (!worlds || !list) && <p className="muted">{t("Loading…")}</p>;
  return { worlds, samples: list, problem, loading, reload: load };
}

/** When a world was last played, or edited if never. */
const playedAt = ({ world, saves }: Shelf[number]) =>
  saves.reduce((latest, s) => (s.updatedAt > latest ? s.updatedAt : latest), world.updatedAt);
const byPlayed = (shelf: Shelf) => [...shelf].sort((a, b) => playedAt(b).localeCompare(playedAt(a)));
const allSaves = (shelf: Shelf) =>
  shelf
    .flatMap(({ world, saves }) => saves.map((save) => ({ world, save })))
    .sort((a, b) => b.save.updatedAt.localeCompare(a.save.updatedAt));
const count = (n: number, zh: string, en: string) => (lang === "zh" ? `${n} ${zh}` : `${n} ${en}`);

function Tags({ tags }: { tags?: string[] }) {
  return (
    <span className="tags">
      {tags?.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </span>
  );
}

function SampleCard({ sample, mine }: { sample: SampleSummary; mine: boolean }) {
  const cover = coverOf(sample);
  return (
    <a className="world-card" href={`#/explore/${sample.id}`}>
      <div className="cover" style={{ background: cover.background }}>
        <b aria-hidden="true">{cover.mark}</b>
        <span>{count(sample.people, "个人物", "people")}</span>
      </div>
      <div className="body">
        <h3>{sample.title}</h3>
        <Tags tags={sample.tags} />
        <p className="clamp">{sample.premise}</p>
        {mine && <span className="muted small">{t("Already in your worlds")}</span>}
      </div>
    </a>
  );
}

function WorldCard({ entry }: { entry: Shelf[number] }) {
  const { world, saves } = entry;
  const cover = coverOf(world);
  return (
    <a className="world-card" href={`#/world/${world.id}`}>
      <div className="cover" style={{ background: cover.background }}>
        <b aria-hidden="true">{cover.mark}</b>
        <span>{count(saves.length, "个存档", "saves")}</span>
      </div>
      <div className="body">
        <h3>{world.title}</h3>
        <Tags tags={world.tags} />
        <p className="clamp">{world.premise}</p>
        <span className="muted small" style={{ marginTop: "auto", paddingTop: 6 }}>
          {when(playedAt(entry))}
        </span>
      </div>
    </a>
  );
}

/** Whether a sample is already among the player's worlds. */
const copied = (shelf: Shelf | null, id: string) => shelf?.some((x) => x.world.from === id) ?? false;

// ── Home: what to play next ──
export function Home() {
  const { worlds, samples, problem, loading } = useData(true);
  const last = worlds && allSaves(worlds)[0];
  const recent = worlds ? byPlayed(worlds).filter((x) => x.world.id !== last?.world.id).slice(0, 3) : [];
  return (
    <Site page="home" title="">
      <div className="site-page">
        {!last && worlds?.length !== 0 && <h1 className="sr">{t("Home")}</h1>}
        {problem}
        {loading}
        {worlds?.length === 0 && (
          <section className="welcome" style={{ backgroundImage: `var(--welcome-shade), url(${homeArt})` }}>
            <h1 className="serif">{t("Pick a world and begin a story")}</h1>
            <p className="muted">
              {t("Every world has its people, places and secrets. Play one of these, or build your own.")}
            </p>
            <div className="row">
              <a className="button primary" href="#/explore">
                {t("Find a world to play")}
              </a>
              <a className="button" href="#/create">
                {t("Build your own")}
              </a>
            </div>
          </section>
        )}
        {last && (
          <section className="continue" aria-labelledby="continue">
            <div className="cover" style={{ background: coverOf(last.world).background }} aria-hidden="true">
              {coverOf(last.world).mark}
            </div>
            <div className="body">
              <h1 id="continue" className="label">
                {t("Continue where you left off")}
              </h1>
              <span className="serif" style={{ fontSize: 30, fontWeight: 700 }}>
                {last.world.title}{" "}
                <span className="muted" style={{ fontSize: 18, fontWeight: 400 }}>
                  · {last.save.title}
                </span>
              </span>
              <span className="muted small">
                {turnLabel(last.save.turns)}
                {last.save.secrets > 0 && ` · ${t("Found")} ${last.save.found} / ${last.save.secrets}`} ·{" "}
                {when(last.save.updatedAt)}
              </span>
              {last.save.last && (
                <p className="serif" style={{ fontSize: 16, lineHeight: 1.8, marginTop: 4 }}>
                  {last.save.last}
                </p>
              )}
              <div className="row" style={{ marginTop: 8 }}>
                <a className="button primary" href={`#/play/${last.save.id}`}>
                  {t("Play on")}
                  <Icon name="arrow" />
                </a>
              </div>
            </div>
          </section>
        )}
        {recent.length > 0 && (
          <section className="site-section" aria-labelledby="recent">
            <div className="section-head">
              <h2 id="recent" className="serif">
                {last ? t("Also played lately") : t("Your worlds")}
              </h2>
              <a className="button quiet small" href="#/create">
                {t("All")} <Icon name="arrow" />
              </a>
            </div>
            <div className="shelf">
              {recent.map((entry) => (
                <WorldCard key={entry.world.id} entry={entry} />
              ))}
            </div>
          </section>
        )}
        {samples && samples.length > 0 && (
          <section className="site-section" aria-labelledby="picks">
            <div className="section-head">
              <h2 id="picks" className="serif">
                {t("Worlds to try")}
              </h2>
              <a className="button quiet small" href="#/explore">
                {t("Explore")} <Icon name="arrow" />
              </a>
            </div>
            <div className="shelf">
              {samples.slice(0, 3).map((s) => (
                <SampleCard key={s.id} sample={s} mine={copied(worlds, s.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Site>
  );
}

// ── Explore: the sample worlds, searched and filtered; both kept in the address ──
export function Explore({ query }: { query: URLSearchParams }) {
  const { worlds, samples, problem, loading } = useData(true);
  const [q, setQ] = useState(query.get("q") ?? "");
  const [tag, setTag] = useState(query.get("tag") ?? "");
  // The site's "Explore" link, or going back, changes the address under this page: follow it.
  useEffect(() => {
    const follow = () => {
      const params = new URLSearchParams(location.hash.split("?")[1]);
      setQ(params.get("q") ?? "");
      setTag(params.get("tag") ?? "");
    };
    addEventListener("hashchange", follow);
    return () => removeEventListener("hashchange", follow);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    const next = `#/explore${params.size ? `?${params}` : ""}`;
    // No new history entry per keystroke, and no hash change: the page stays as it is.
    if (location.hash !== next) history.replaceState(null, "", next);
  }, [q, tag]);
  // Every tag in use, the most used first.
  const tags = Object.entries(
    (samples ?? []).flatMap((s) => s.tags).reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([x]) => x);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = (samples ?? []).filter(
    (s) =>
      (!tag || s.tags.includes(tag)) &&
      words.every((w) => [s.title, s.premise, ...s.tags].some((text) => text.toLowerCase().includes(w))),
  );
  return (
    <Site page="explore" title={t("Explore")}>
      <div className="site-page">
        <div className="page-head">
          <div>
            <h1 className="serif">{t("Explore")}</h1>
            <span className="muted small">{t("Pick a world to play; copy one to make it your own.")}</span>
          </div>
          <input
            type="search"
            className="search"
            aria-label={t("Search worlds")}
            placeholder={t("Search worlds and genres")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {problem}
        {loading}
        {samples && (
          <>
            <div className="chips filter" role="group" aria-label={t("Genre")}>
              <button type="button" className="chip" aria-pressed={!tag} onClick={() => setTag("")}>
                {t("All")}
              </button>
              {tags.map((x) => (
                <button key={x} type="button" className="chip" aria-pressed={tag === x} onClick={() => setTag(tag === x ? "" : x)}>
                  {x}
                </button>
              ))}
            </div>
            <p className="muted small" aria-live="polite">
              {count(shown.length, "个世界", shown.length === 1 ? "world" : "worlds")}
            </p>
            {shown.length > 0 ? (
              <div className="shelf">
                {shown.map((s) => (
                  <SampleCard key={s.id} sample={s} mine={copied(worlds, s.id)} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>
                  {q.trim() ? (lang === "zh" ? `没有找到“${q.trim()}”` : `Nothing found for “${q.trim()}”`) : t("No worlds here")}
                </span>
                <div className="row">
                  <button
                    onClick={() => {
                      setQ("");
                      setTag("");
                    }}
                  >
                    {t("Clear the search")}
                  </button>
                  <a className="button quiet" href="#/create">
                    {t("Build your own")}
                  </a>
                </div>
              </div>
            )}
            <p className="muted small" style={{ textAlign: "center", marginTop: 8 }}>
              {t("These are the official sample worlds. Once worlds can be shared, everyone's will be here too.")}
            </p>
          </>
        )}
      </div>
    </Site>
  );
}

// ── A sample's introduction: play it, or copy it to change ──
export function SamplePage({ id }: { id: string }) {
  const [intro, setIntro] = useState<SampleIntro | null>(null);
  const { worlds, problem, reload } = useData(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.sample(id).then(setIntro, (e: Error) => setError(t(e.message)));
  }, [id]);
  const copies = worlds ? byPlayed(worlds).filter((x) => x.world.from === id) : [];
  // The copy played last; a copy made to change and never played only if there is no other.
  const mine = copies.find((x) => x.saves.length > 0) ?? copies[0];
  const latest = mine && allSaves([mine])[0];
  // Once: a double click would copy twice. A failure leaves nothing behind but the message.
  const go = (work: () => Promise<string>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    work().then(
      (hash) => (location.hash = hash),
      (e: Error) => {
        setBusy(false);
        // A copy made before the failure is found again, so a retry plays it rather than copying anew.
        reload();
        setError(t(e.message));
      },
    );
  };
  const play = () =>
    go(async () => {
      const world = mine?.world ?? (await api.copySample(id));
      return `#/play/${(await api.startSave(world.id, nextSaveName(mine?.saves ?? []))).id}`;
    });
  const copy = () =>
    go(async () => {
      return `#/studio/${(await api.copySample(id, `${intro!.title}${t(" (copy)")}`)).id}`;
    });
  const cover = intro && coverOf(intro);
  return (
    <Site page="explore" title={intro?.title ?? t("Explore")}>
      <div className="site-page narrow">
        <a className="button quiet small" href="#/explore" style={{ alignSelf: "flex-start" }}>
          <Icon name="back" />
          {t("Explore")}
        </a>
        {problem}
        {error && <p className="error" role="alert">{error}</p>}
        {!intro && !error && <p className="muted">{t("Loading…")}</p>}
        {intro && cover && (
          <>
            <section className="intro-head">
              <div className="cover" style={{ background: cover.background }} aria-hidden="true">
                {cover.mark}
              </div>
              <div className="intro-body">
                <Tags tags={[...intro.tags, t("Official sample")]} />
                <h1 className="serif">{intro.title}</h1>
                <p className="serif">{intro.premise}</p>
                <span className="muted small">
                  {count(intro.people, "个人物", "people")} · {count(intro.places, "个地点", "places")}
                </span>
                <div className="row" style={{ marginTop: 6 }}>
                  {latest && (
                    <a className="button primary" href={`#/play/${latest.save.id}`}>
                      {t("Play on")}
                    </a>
                  )}
                  <button className={latest ? "" : "primary"} onClick={play} disabled={busy || !worlds}>
                    {mine ? t("Start a new game") : t("Start playing")}
                  </button>
                  <button onClick={copy} disabled={busy || !worlds}>
                    {t("Copy it to change")}
                  </button>
                </div>
                <span className="muted small" aria-live="polite">
                  {busy
                    ? t("Getting it ready…")
                    : mine
                      ? lang === "zh"
                        ? `它已经在你的世界里了，有 ${mine.saves.length} 个存档。`
                        : `It is in your worlds already, with ${mine.saves.length} saves.`
                      : t("Playing copies it into your worlds; later changes to the sample never touch your games.")}
                  {mine && !busy && (
                    <>
                      {" "}
                      <a href={`#/world/${mine.world.id}`}>{t("See its saves")}</a>
                    </>
                  )}
                </span>
              </div>
            </section>
            <section className="site-section" aria-labelledby="people">
              <h2 id="people" className="serif">
                {t("People")}
              </h2>
              <div className="people-grid">
                {intro.characters.map((c, i) => (
                  <div key={c.name} className="person-chip">
                    <span className={i === 0 ? "avatar me" : "avatar"} aria-hidden="true">
                      {c.name.slice(0, 1)}
                    </span>
                    <span>
                      <b>{c.name}</b>
                      {i === 0 && <span className="tag">{t("you play")}</span>}
                      <br />
                      <span className="muted small">{c.persona}</span>
                    </span>
                  </div>
                ))}
              </div>
              {intro.people > intro.characters.length && (
                <span className="muted small">
                  {lang === "zh"
                    ? `还有 ${intro.people - intro.characters.length} 个人物，玩的时候会遇到。`
                    : `${intro.people - intro.characters.length} more you will meet as you play.`}
                </span>
              )}
            </section>
            <section className="site-section" aria-labelledby="opening">
              <h2 id="opening" className="serif">
                {t("Opening")}
              </h2>
              <p className="serif opening-quote">{intro.opening}</p>
            </section>
          </>
        )}
      </div>
    </Site>
  );
}

// ── Create: a new world, and the player's worlds ──
export function Create() {
  const { worlds, problem, loading } = useData(false);
  const shelf = worlds ? byPlayed(worlds) : [];
  return (
    <Site page="create" title={t("Create")}>
      <div className="site-page narrow">
        <h1 className="serif">{t("Create")}</h1>
        <div className="row" style={{ gap: 14, alignItems: "stretch" }}>
          <a className="button choice" href="#/studio/new">
            <b>{t("Let the AI build it")}</b>
            <span className="muted small">{t("Answer a few questions; the AI writes the people, places and opening.")}</span>
          </a>
          <a className="button choice" href="#/studio/new/manual">
            <b>{t("Write it yourself")}</b>
            <span className="muted small">{t("Fill in the title, premise, people and places in the editor.")}</span>
          </a>
        </div>
        {problem}
        {loading}
        {worlds && (
          <section className="site-section list" aria-labelledby="mine">
            <h2 id="mine" className="serif">
              {t("Your worlds")} <span className="muted small">{shelf.length}</span>
            </h2>
            {shelf.length === 0 && (
              <p className="muted list-row">{t("No worlds yet. Build one above, or copy one from Explore.")}</p>
            )}
            {shelf.map((entry) => {
              const { world, saves } = entry;
              const cover = coverOf(world);
              return (
                <div className="list-row" key={world.id}>
                  <span className="mini-cover" style={{ background: cover.background }} aria-hidden="true">
                    {cover.mark}
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <a className="row-title" href={`#/world/${world.id}`}>
                      {world.title}
                    </a>{" "}
                    <Tags tags={world.tags} />
                    <br />
                    <span className="muted small">
                      {count(saves.length, "个存档", "saves")} · {when(playedAt(entry))}
                    </span>
                  </div>
                  <a className="button small" href={`#/studio/${world.id}`}>
                    {t("Edit")}
                  </a>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </Site>
  );
}

// ── Mine: every save, the most recently played first ──
export function Mine() {
  const { worlds, problem, loading } = useData(false);
  const saves = worlds ? allSaves(worlds) : [];
  return (
    <Site page="me" title={t("Mine")}>
      <div className="site-page narrow">
        <Account />
        <h1 className="serif">{t("Your saves")}</h1>
        {problem}
        {loading}
        {worlds && saves.length === 0 && (
          <div className="empty">
            <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>
              {t("No saves yet")}
            </span>
            <span className="muted">{t("Start a game and it is kept here.")}</span>
            <a className="button primary" href="#/explore">
              {t("Find a world to play")}
            </a>
          </div>
        )}
        {saves.length > 0 && (
          <section className="list" aria-label={t("Your saves")}>
            {saves.map(({ world, save }, i) => {
              const cover = coverOf(world);
              return (
                <div className="list-row" key={save.id}>
                  <span className="mini-cover" style={{ background: cover.background }} aria-hidden="true">
                    {cover.mark}
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <a className="row-title" href={`#/world/${world.id}`}>
                      {world.title}
                    </a>{" "}
                    <span className="muted small">· {save.title}</span>
                    {save.last && <div className="last">{save.last}</div>}
                    <span className="muted small">
                      {turnLabel(save.turns)} · {when(save.updatedAt)}
                    </span>
                  </div>
                  <a className={i === 0 ? "button primary small" : "button small"} href={`#/play/${save.id}`}>
                    {t("Continue")}
                  </a>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </Site>
  );
}

/** Who is playing, read once per page. */
function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => void api.me().then(setMe, () => setMe(null)), []);
  return me;
}

// ── The account, on the public site: who is signed in, signing out, and leaving for good ──
function Account() {
  const me = useMe();
  const [leaving, setLeaving] = useState(false);
  if (me?.mode !== "public" || !me.user) return null;
  const { email, role, points } = me.user;
  const left = points.limit === null ? null : Math.max(0, points.limit - points.used);
  return (
    <section className="account" aria-label={t("Account")}>
      <div className="grow" style={{ minWidth: 0 }}>
        <b>{email}</b> {role === "admin" && <span className="tag">{t("Admin")}</span>}
        <br />
        <span className="muted small">
          {left === null
            ? t("No daily limit")
            : lang === "zh"
              ? `今天还剩 ${left} 点（共 ${points.limit} 点，北京时间 0 点恢复）`
              : `${left} of ${points.limit} points left today (back at midnight, Beijing time)`}
        </span>{" "}
        <br />
        <a className="muted small" href="#/privacy">
          {t("Privacy")}
        </a>
      </div>
      <button className="small" onClick={() => api.signOut().then(() => (location.hash = "#/login"))}>
        {t("Sign out")}
      </button>
      {role !== "admin" && (
        <button className="small quiet danger-text" onClick={() => setLeaving(true)}>
          {t("Delete account…")}
        </button>
      )}
      {leaving && <DeleteAccount email={email} onClose={() => setLeaving(false)} />}
    </section>
  );
}

function DeleteAccount({ email, onClose }: { email: string; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = t("Delete your account?");
  return (
    <Dialog className="confirm" label={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          api.deleteAccount(typed).then(
            () => (location.hash = "#/login"),
            (err: Error) => {
              setBusy(false);
              setError(t(err.message));
            },
          );
        }}
      >
        <h2 style={{ fontSize: 17 }}>{title}</h2>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          {t("Your account, every world you made and every save go at once, for good.")}
        </p>
        <label>
          {lang === "zh" ? `输入 ${email} 确认` : `Type ${email} to confirm`}
          <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button type="submit" className="danger" disabled={busy || typed.trim().toLowerCase() !== email}>
            {t("Delete everything")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// ── Signing in, or joining with an invite: a code by email either way ──
export function SignIn({ join: joining, invite: given }: { join: boolean; invite: string }) {
  const me = useMe();
  const [join, setJoin] = useState(joining);
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState(given.toUpperCase());
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const tick = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(tick);
  }, [wait]);
  const work = (job: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    job()
      .catch((e: Error) => setError(t(e.message)))
      .finally(() => setBusy(false));
  };
  const send = () =>
    work(async () => {
      await api.sendCode(email, join ? invite : "");
      setSent(true);
      setWait(60);
    });
  const verify = () =>
    work(async () => {
      await api.verify(email, code, join ? invite : "");
      afterSignIn();
    });
  if (me?.mode === "local")
    return (
      <Site page="me" title={t("Sign in")}>
        <div className="site-page narrow">
          <p className="muted">{t("On this machine there is nothing to sign in to.")}</p>
        </div>
      </Site>
    );
  const note = join
    ? lang === "zh"
      ? `验证码已发到 ${email}，10 分钟内有效。没收到的话看看垃圾箱。`
      : `A code is on its way to ${email}; it works for 10 minutes. Not there? Look in spam.`
    : lang === "zh"
      ? `如果 ${email} 已经注册，验证码已经发过去了，10 分钟内有效。没收到的话看看垃圾箱。`
      : `If ${email} has an account, a code is on its way; it works for 10 minutes. Not there? Look in spam.`;
  return (
    <Site page="me" title={join ? t("Join") : t("Sign in")}>
      <div className="site-page sign-in">
        <h1 className="serif">{join ? t("Join the beta") : t("Sign in")}</h1>
        <p className="muted">
          {join
            ? t("Simulora is invite-only for now. Your invite code and an email address are all it takes.")
            : t("We email you a code; no password.")}
        </p>
        <form
          className="s-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (sent) verify();
            else send();
          }}
        >
          <label>
            {t("Email")}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={sent}
              placeholder="you@qq.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {join && (
            <label>
              {t("Invite code")}
              <input
                required
                value={invite}
                disabled={sent}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setInvite(e.target.value.toUpperCase())}
              />
            </label>
          )}
          {sent && (
            <>
              <p className="muted small" role="status">
                {note}
              </p>
              <label>
                {t("Code")}
                <input
                  autoFocus
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="row">
            <button type="submit" className="primary" disabled={busy}>
              {sent ? (join ? t("Join") : t("Sign in")) : t("Email me a code")}
            </button>
            {sent && (
              <>
                <button type="button" disabled={busy || wait > 0} onClick={send}>
                  {wait > 0 ? (lang === "zh" ? `重新发送（${wait} 秒）` : `Send again (${wait}s)`) : t("Send again")}
                </button>
                <button
                  type="button"
                  className="quiet"
                  onClick={() => {
                    setSent(false);
                    setCode("");
                    setError("");
                  }}
                >
                  {t("Use another address")}
                </button>
              </>
            )}
          </div>
        </form>
        {!sent && (
          <button type="button" className="quiet" style={{ alignSelf: "flex-start" }} onClick={() => setJoin(!join)}>
            {join ? t("Have an account? Sign in") : t("Have an invite code? Join")}
          </button>
        )}
        <p className="muted small">
          {t("Common mailboxes only: QQ, 163, 126, Gmail, Outlook, iCloud and the like.")}{" "}
          <a href="#/privacy">{t("Privacy")}</a>
        </p>
      </div>
    </Site>
  );
}

// ── What is kept, where it goes, and how to delete it ──
const PRIVACY: Record<"zh" | "en", [string, string][]> = {
  zh: [
    ["我们存什么", "你的邮箱；你创建的世界、存档和故事；每天用了多少。没有密码，登录用的是邮件验证码。"],
    ["会发给谁", "你写的内容和故事会发给 AI 服务商（ModelScope）来续写；验证码邮件经 Gmail 发出。除此之外不给任何人，也不用来做广告。"],
    ["Cookie", "只有一个用来保持登录的 Cookie，30 天有效。没有统计，没有广告。"],
    ["怎么删除", "在“我的”里删除账号：账号和你所有的世界、存档会立刻删除，不能恢复。服务器日志只记出错和用量这类技术信息，不记故事内容。"],
    ["测试版", "现在是邀请制内测：没有备份，数据可能丢失；规则和额度可能调整。请不要用它写违法内容，违反的账号会被停用。"],
  ],
  en: [
    ["What we keep", "Your email address; the worlds, saves and stories you make; how much you play each day. No password: you sign in with a code by email."],
    ["Who sees it", "What you write and the story go to the AI provider (ModelScope), which writes the story on; sign-in codes are sent through Gmail. Nobody else, and nothing is used for ads."],
    ["Cookies", "One, to keep you signed in for 30 days. No analytics, no ads."],
    ["Deleting", "Delete your account under Mine: the account and all your worlds and saves go at once, for good. The server's logs hold errors and usage counts, never your story."],
    ["Beta", "This is an invite-only beta: there are no backups and data may be lost; rules and limits may change. Nothing illegal, please: accounts that do so are closed."],
  ],
};

export function Privacy() {
  return (
    <Site page="me" title={t("Privacy")}>
      <div className="site-page narrow">
        <h1 className="serif">{t("Privacy")}</h1>
        {PRIVACY[lang === "zh" ? "zh" : "en"].map(([head, text]) => (
          <section key={head} className="site-section">
            <h2 className="serif">{head}</h2>
            <p style={{ lineHeight: 1.8 }}>{text}</p>
          </section>
        ))}
      </div>
    </Site>
  );
}
