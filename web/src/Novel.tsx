import { useState } from "react";
import { api } from "./api.ts";
import { lang, t } from "./i18n.ts";

type Chapter = { from: number; title: string; text: string };

/** The play made into chapters of ten turns, written when asked, read here and saved as one text file. */
export function Novel({
  saveId,
  turns,
  kept,
  name,
  onClose,
}: {
  saveId: string;
  turns: number;
  /** The whole chapters already written, by chapter. */
  kept: (Chapter | undefined)[];
  name: string;
  onClose: () => void;
}) {
  const count = Math.ceil(turns / 10);
  const [chapters, setChapters] = useState<(Chapter | undefined)[]>(kept);
  const [writing, setWriting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const label = (n: number) => {
    const from = n * 10 + 1;
    const to = Math.min((n + 1) * 10, turns);
    return lang === "zh" ? `第 ${n + 1} 章 · 第 ${from}–${to} 回合` : `Chapter ${n + 1} · turns ${from}–${to}`;
  };

  const write = async (n: number) => {
    setWriting(n);
    setError("");
    try {
      const chapter = await api.chapter(saveId, n);
      setChapters((all) => Object.assign([...all], { [n]: chapter }));
      return true;
    } catch (e) {
      setError(t((e as Error).message));
      return false;
    } finally {
      setWriting(null);
    }
  };
  const writeAll = async () => {
    for (let n = 0; n < count; n++) if (!chapters[n] && !(await write(n))) return;
  };
  const save = () => {
    const text = chapters
      .map((c, n) => c && `${lang === "zh" ? `第 ${n + 1} 章` : `Chapter ${n + 1}`}　${c.title}\n\n${c.text}`)
      .filter(Boolean)
      .join("\n\n\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`${name}\n\n\n${text}\n`], { type: "text/plain;charset=utf-8" }));
    link.download = `${name.replace(/[\\/:*?"<>|]/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="graph novel" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <h2>{t("Novel")}</h2>
          <button className="link" onClick={onClose} aria-label={t("Close")}>
            ✕
          </button>
        </div>
        <div className="row">
          <button onClick={writeAll} disabled={writing !== null}>
            {t("Write them all")}
          </button>
          <button onClick={save} disabled={!chapters.some(Boolean)}>
            {t("Save as a file")}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {Array.from({ length: count }, (_, n) => {
          const c = chapters[n];
          return (
            <article key={n}>
              <p className="muted small">{label(n)}</p>
              {c ? (
                <>
                  <h3>{c.title}</h3>
                  {c.text
                    .split(/\n+/)
                    .filter((p) => p.trim())
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </>
              ) : (
                <button onClick={() => write(n)} disabled={writing !== null}>
                  {writing === n ? t("Writing…") : t("Write this chapter")}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
