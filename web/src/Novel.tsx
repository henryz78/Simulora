import { useEffect, useRef, useState } from "react";
import { api } from "./api.ts";
import { lang, t } from "./i18n.ts";
import { Dialog, Icon } from "./ui.tsx";

type Chapter = { from: number; title: string; text: string };

/** The play made into chapters of ten turns, written when asked, read one at a time and saved as one text file. */
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
  const [at, setAt] = useState(0);
  const [toc, setToc] = useState(false);
  const [writing, setWriting] = useState<number | null>(null);
  const [failed, setFailed] = useState<{ n: number; message: string } | null>(null);
  // Closed, it stops writing: the rest is not asked for.
  const closed = useRef(false);
  useEffect(() => () => void (closed.current = true), []);
  const numeral = (n: number) => (lang === "zh" ? `第 ${n + 1} 章` : `Chapter ${n + 1}`);
  const span = (n: number) => {
    const from = n * 10 + 1;
    const to = Math.min((n + 1) * 10, turns);
    return lang === "zh" ? `第 ${from}–${to} 回合` : `turns ${from}–${to}`;
  };

  const write = async (n: number) => {
    setWriting(n);
    setFailed(null);
    try {
      const chapter = await api.chapter(saveId, n);
      setChapters((all) => Object.assign([...all], { [n]: chapter }));
      return true;
    } catch (e) {
      setFailed({ n, message: t((e as Error).message) });
      return false;
    } finally {
      setWriting(null);
    }
  };
  const writeAll = async () => {
    for (let n = 0; n < count && !closed.current; n++) if (!chapters[n] && !(await write(n))) return;
  };
  const save = () => {
    const text = chapters
      .map((c, n) => c && `${numeral(n)}${c.title ? `　${c.title}` : ""}\n\n${c.text}`)
      .filter(Boolean)
      .join("\n\n\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`${name}\n\n\n${text}\n`], { type: "text/plain;charset=utf-8" }));
    link.download = `${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim() || "novel"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const c = chapters[at];

  return (
    <Dialog className="novel" label={t("Novel")} onClose={onClose}>
      <div className="dialog-head">
        <span className="row" style={{ gap: 8 }}>
          <button className="small" aria-expanded={toc} onClick={() => setToc(!toc)}>
            {t("Contents")} ▾
          </button>
          {numeral(at)}
        </span>
        <span className="row" style={{ gap: 6 }}>
          <button className="small" onClick={writeAll} disabled={writing !== null}>
            {t("Write them all")}
          </button>
          <button className="small" onClick={save} disabled={!chapters.some(Boolean)}>
            {t("Save as a file")}
          </button>
          <button className="quiet small" onClick={onClose} aria-label={t("Close")}>
            <Icon name="close" />
          </button>
        </span>
      </div>
      {toc && (
        <nav className="toc" aria-label={t("Contents")}>
          {Array.from({ length: count }, (_, n) => (
            <button
              key={n}
              className="small"
              aria-current={n === at}
              onClick={() => {
                setAt(n);
                setToc(false);
              }}
            >
              <span>
                {numeral(n)}
                {chapters[n]?.title && ` · ${chapters[n]!.title}`}
              </span>
              <span className="muted small">{writing === n ? t("Writing…") : chapters[n] ? "" : t("not written yet")}</span>
            </button>
          ))}
        </nav>
      )}
      <div className="page">
        <div>
          {failed && (
            <div className="note fail" role="alert">
              <b>{lang === "zh" ? `${numeral(failed.n)}没整理出来` : `${numeral(failed.n)} was not written`}</b>
              <span className="muted small">{failed.message}</span>
              <div>
                <button className="small" onClick={() => write(failed.n)}>
                  {t("Try again")}
                </button>
              </div>
            </div>
          )}
          {c ? (
            <article className="story">
              <h2 style={{ fontSize: 24, textAlign: "center", fontFamily: "var(--serif)" }}>{c.title || numeral(at)}</h2>
              <p className="muted small" style={{ textIndent: 0, textAlign: "center", fontFamily: "var(--sans)", marginBottom: 20 }}>
                {span(at)} · {lang === "zh" ? `共 ${count} 章` : `${count} chapters`}
              </p>
              {c.text
                .split(/\n+/)
                .filter((p) => p.trim())
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </article>
          ) : (
            <div className="note" style={{ alignItems: "center", textAlign: "center", padding: 24 }}>
              <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>
                {numeral(at)} · {span(at)}
              </span>
              <span className="muted">{t("Not written yet. A chapter takes about a minute.")}</span>
              <button className="primary small" onClick={() => write(at)} disabled={writing !== null}>
                {writing === at ? t("Writing…") : t("Write this chapter")}
              </button>
            </div>
          )}
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="small" disabled={at === 0} onClick={() => setAt(at - 1)}>
              ‹ {t("Previous chapter")}
            </button>
            <button className="small" disabled={at >= count - 1} onClick={() => setAt(at + 1)}>
              {t("Next chapter")} ›
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
