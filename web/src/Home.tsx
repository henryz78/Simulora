import { useEffect, useState } from "react";
import type { Save, World } from "../../shared/types.ts";
import { api } from "./api.ts";
import { t } from "./i18n.ts";

export function Home() {
  const [worlds, setWorlds] = useState<{ world: World; saves: Save[] }[] | null>(null);
  const [error, setError] = useState("");
  const load = () => api.worlds().then(setWorlds, (e: Error) => setError(e.message));
  useEffect(() => void load(), []);

  const play = (world: World) =>
    api.startSave(world.id, new Date().toLocaleString()).then(
      (save) => (location.hash = `#/play/${save.id}`),
      (e: Error) => setError(e.message),
    );
  const removeWorld = async (id: string) => {
    if (confirm(t("Delete this world and all its saves?"))) await api.deleteWorld(id).then(load);
  };
  const removeSave = async (id: string) => {
    if (confirm(t("Delete this save?"))) await api.deleteSave(id).then(load);
  };

  return (
    <main className="page">
      <header className="bar">
        <span className="brand">Simulora</span>
        <a className="button primary" href="#/studio/new">
          {t("New world")}
        </a>
      </header>
      <h1>{t("Your worlds")}</h1>
      {error && <p className="error">{error}</p>}
      {worlds?.length === 0 && <p className="muted">{t("No worlds yet. Build one to begin.")}</p>}
      <div className="cards">
        {worlds
          ?.sort((a, b) => b.world.updatedAt.localeCompare(a.world.updatedAt))
          .map(({ world, saves }) => (
            <article className="card" key={world.id}>
              <h2>{world.title}</h2>
              <p className="muted clamp">{world.premise}</p>
              <ul className="saves">
                {saves
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .map((save) => (
                    <li key={save.id}>
                      <a href={`#/play/${save.id}`}>{save.title}</a>
                      <span className="muted small">{new Date(save.updatedAt).toLocaleString()}</span>
                      <button className="link" onClick={() => removeSave(save.id)}>
                        {t("Delete")}
                      </button>
                    </li>
                  ))}
              </ul>
              <div className="row">
                <button className="primary" onClick={() => play(world)}>
                  {t("New save")}
                </button>
                <a className="button" href={`#/studio/${world.id}`}>
                  {t("Edit")}
                </a>
                <button className="link danger" onClick={() => removeWorld(world.id)}>
                  {t("Delete")}
                </button>
              </div>
            </article>
          ))}
      </div>
    </main>
  );
}
