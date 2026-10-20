import { useEffect, useState } from "react";
import type { SaveSummary, World } from "../../shared/types.ts";
import { api } from "./api.ts";
import { lang, t } from "./i18n.ts";
import { coverOf, Icon, LookButton, turnLabel, when } from "./ui.tsx";

type Shelf = { world: World; saves: SaveSummary[] }[];

/** When a world was last played, or made if never. */
const playedAt = ({ world, saves }: Shelf[number]) =>
  saves.reduce((latest, s) => (s.updatedAt > latest ? s.updatedAt : latest), world.updatedAt);

export function Home() {
  const [worlds, setWorlds] = useState<Shelf | null>(null);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    api.worlds().then(setWorlds, (e: Error) => setError(e.message));
  };
  useEffect(load, []);

  const shelf = [...(worlds ?? [])].sort((a, b) => playedAt(b).localeCompare(playedAt(a)));
  const last = shelf
    .flatMap(({ world, saves }) => saves.map((save) => ({ world, save })))
    .sort((a, b) => b.save.updatedAt.localeCompare(a.save.updatedAt))[0];

  return (
    <>
      <header className="topbar">
        <span className="seal" aria-hidden="true">
          拟
        </span>
        <span className="brand grow">Simulora</span>
        <LookButton />
        <a className="button primary" href="#/studio/new">
          <Icon name="plus" />
          {t("New world")}
        </a>
      </header>

      <main className="home">
        {error && (
          <div className="note fail" role="alert">
            <b>{t("Could not read your worlds")}</b>
            <span className="small muted">{t(error)}</span>
            <div>
              <button className="small" onClick={load}>
                {t("Retry")}
              </button>
            </div>
          </div>
        )}
        {!worlds && !error && <p className="muted">{t("Loading…")}</p>}

        {last && (
          <section className="continue" aria-labelledby="continue">
            <div className="cover" style={{ background: coverOf(last.world).background }} aria-hidden="true">
              {coverOf(last.world).mark}
            </div>
            <div className="body">
              <h2 id="continue" className="label">
                {t("Continue where you left off")}
              </h2>
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

        {worlds?.length === 0 && (
          <div className="empty">
            <span className="serif" style={{ fontSize: 20, fontWeight: 600 }}>
              {t("No worlds yet")}
            </span>
            <span className="muted">
              {t(
                "Describe the story you want to play: the AI sets up its people, places and opening, or write it yourself.",
              )}
            </span>
            <a className="button primary" href="#/studio/new">
              {t("Build your first world")}
            </a>
          </div>
        )}

        {shelf.length > 0 && (
          <section aria-labelledby="shelf" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
              <h2 id="shelf" className="serif" style={{ fontSize: 20 }}>
                {t("Your worlds")}
              </h2>
              <span className="muted small">{t("most recently played first")}</span>
            </div>
            <div className="shelf">
              {shelf.map((entry) => {
                const { world, saves } = entry;
                const cover = coverOf(world);
                return (
                  <a key={world.id} className="world-card" href={`#/world/${world.id}`}>
                    <div className="cover" style={{ background: cover.background }}>
                      <b aria-hidden="true">{cover.mark}</b>
                      <span>{lang === "zh" ? `${saves.length} 个存档` : `${saves.length} saves`}</span>
                    </div>
                    <div className="body">
                      <h3>{world.title}</h3>
                      <p className="clamp">{world.premise}</p>
                      <span className="muted small" style={{ marginTop: "auto", paddingTop: 6 }}>
                        <span className="narrow-only">
                          {lang === "zh" ? `${saves.length} 个存档 · ` : `${saves.length} saves · `}
                        </span>
                        {when(playedAt(entry))}
                      </span>
                    </div>
                  </a>
                );
              })}
              <a className="button new-card" href="#/studio/new">
                <Icon name="plus" size={26} />
                {t("Build a new world")}
                <span className="small">{t("Answer a few questions and the AI sets it up")}</span>
              </a>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
