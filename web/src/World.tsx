import { useEffect, useState } from "react";
import type { SaveSummary, World as WorldT } from "../../shared/types.ts";
import { api } from "./api.ts";
import { lang, t } from "./i18n.ts";
import { Ask, Confirm, coverOf, Icon, LookButton, Menu, nextSaveName, turnLabel, when } from "./ui.tsx";

/** One world: what it is, its saves (newest played first), a new game, editing, deleting. */
export function World({ worldId }: { worldId: string }) {
  const [entry, setEntry] = useState<{ world: WorldT; saves: SaveSummary[] } | null>(null);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState<
    { kind: "rename" | "delete"; save: SaveSummary } | { kind: "delete world" } | null
  >(null);
  const load = () =>
    api.worlds().then(
      (all) => {
        const found = all.find((x) => x.world.id === worldId);
        if (found) setEntry(found);
        else setError(t("This world is gone"));
      },
      (e: Error) => setError(t(e.message)),
    );
  useEffect(() => void load(), [worldId]);
  const report = (e: Error) => setError(t(e.message));

  const top = (
    <header className="topbar">
      <a className="button quiet small" href="#/">
        <Icon name="back" />
        {t("Your worlds")}
      </a>
      <span className="grow" />
      <LookButton />
    </header>
  );
  if (!entry)
    return (
      <>
        {top}
        <main className="world-page">{error ? <p className="error">{error}</p> : <p className="muted">{t("Loading…")}</p>}</main>
      </>
    );

  const { world, saves } = entry;
  const sorted = [...saves].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const cover = coverOf(world);
  const start = () =>
    api.startSave(world.id, nextSaveName(saves)).then((s) => (location.hash = `#/play/${s.id}`), report);

  return (
    <>
      {top}
      <main className="world-page">
        {error && <p className="error">{error}</p>}
        <section className="world-head">
          <div className="cover" style={{ background: cover.background }} aria-hidden="true">
            {cover.mark}
          </div>
          <div className="grow" style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 10 }}>
            <h1 className="serif" style={{ fontSize: 30, fontWeight: 700 }}>
              {world.title}
            </h1>
            <p className="serif" style={{ fontSize: 15, lineHeight: 1.8 }}>
              {world.premise}
            </p>
            <span className="muted small">
              {lang === "zh"
                ? `${world.state.characters.length} 个人物 · ${world.state.places.length} 个地点`
                : `${world.state.characters.length} people · ${world.state.places.length} places`}
              {world.state.characters[0] && ` · ${t("you start as")} ${world.state.characters[0].name}`}
            </span>
            <div className="row" style={{ marginTop: 6 }}>
              <button className="primary" onClick={start}>
                {t("Start a new game")}
              </button>
              <a className="button" href={`#/studio/${world.id}`}>
                {t("Edit world")}
              </a>
              <Menu label={<>{t("More")} ⋯</>} title={t("More")} className="quiet">
                {(close) => (
                  <button type="button"
                    role="menuitem"
                    className="danger-text"
                    onClick={() => {
                      close();
                      setAsking({ kind: "delete world" });
                    }}
                  >
                    {t("Delete world…")}
                  </button>
                )}
              </Menu>
            </div>
          </div>
        </section>

        <section aria-labelledby="saves" style={{ display: "flex", flexDirection: "column" }}>
          <h2 id="saves" className="label" style={{ marginBottom: 8 }}>
            {t("Saves")} · {saves.length} · {t("most recently played first")}
          </h2>
          {sorted.length === 0 && (
            <p className="muted" style={{ padding: "16px 4px", borderTop: "1px solid var(--line)" }}>
              {t("No games yet: start one above.")}
            </p>
          )}
          {sorted.map((save, i) => (
            <div className="save-row" key={save.id}>
              <div className="grow" style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{save.title}</span>
                {save.last && <span className="last">{save.last}</span>}
              </div>
              <span className="muted small" style={{ width: 80 }}>
                {turnLabel(save.turns)}
              </span>
              <span className="muted small" style={{ width: 96 }}>
                {when(save.updatedAt)}
              </span>
              <a className={i === 0 ? "button primary small" : "button small"} href={`#/play/${save.id}`}>
                {t("Continue")}
              </a>
              <Menu label="⋯" title={`${save.title} · ${t("More")}`} className="quiet small" align="right">
                {(close) => (
                  <>
                    <button type="button"
                      role="menuitem"
                      onClick={() => {
                        close();
                        setAsking({ kind: "rename", save });
                      }}
                    >
                      {t("Rename")}
                    </button>
                    <button type="button"
                      role="menuitem"
                      onClick={() => {
                        close();
                        api
                          .branch(save.id, save.headId, `${save.title} · ${t("branch")}`)
                          .then((b) => (location.hash = `#/play/${b.id}`), report);
                      }}
                    >
                      {t("Branch from the latest turn")}
                    </button>
                    <button type="button"
                      role="menuitem"
                      className="danger-text"
                      onClick={() => {
                        close();
                        setAsking({ kind: "delete", save });
                      }}
                    >
                      {t("Delete save…")}
                    </button>
                  </>
                )}
              </Menu>
            </div>
          ))}
          <p className="muted small" style={{ padding: "12px 4px", borderTop: "1px solid var(--line)" }}>
            {t("New games are numbered on their own; rename them any time.")}
          </p>
        </section>
      </main>

      {asking?.kind === "rename" && (
        <Ask
          title={t("Name this save")}
          value={asking.save.title}
          onDone={(title) => api.rename(asking.save.id, title).then(load, report)}
          onClose={() => setAsking(null)}
        />
      )}
      {asking?.kind === "delete" && (
        <Confirm
          title={lang === "zh" ? `删除存档“${asking.save.title}”？` : `Delete the save “${asking.save.title}”?`}
          text={
            lang === "zh"
              ? `${asking.save.turns} 个回合会一起删掉，不能恢复。世界本身和其他存档不受影响。`
              : `Its ${asking.save.turns} turns go with it, for good. The world and its other saves stay.`
          }
          action={t("Delete")}
          onConfirm={() => api.deleteSave(asking.save.id).then(load, report)}
          onClose={() => setAsking(null)}
        />
      )}
      {asking?.kind === "delete world" && (
        <Confirm
          title={lang === "zh" ? `删除世界“${world.title}”？` : `Delete the world “${world.title}”?`}
          text={
            lang === "zh"
              ? `世界和它的 ${saves.length} 个存档会一起删掉，不能恢复。`
              : `The world and its ${saves.length} saves go, for good.`
          }
          action={t("Delete")}
          onConfirm={() => api.deleteWorld(world.id).then(() => (location.hash = "#/"), report)}
          onClose={() => setAsking(null)}
        />
      )}
    </>
  );
}
