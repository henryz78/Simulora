// The small pieces every page shares: icons, avatars, covers, the theme, menus and dialogs.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Dice, Save, World } from "../../shared/types.ts";
import { lang, t } from "./i18n.ts";

const PATHS = {
  clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M18 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0M12 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  auto: "M12 3a9 9 0 1 0 0 18zM21 12a9 9 0 0 0-9-9",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  dice: "M12 2l9 5v10l-9 5-9-5V7zM12 22V12M3 7l9 5 9-5",
  lock: "M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3",
  unlock: "M5 11h14v9H5zM8 11V8a4 4 0 0 1 7.5-2",
  graph: "M8 7l7.5 1M7 8l2 7.5M16.5 10l-5 6M8.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M20.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M12.5 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0",
  close: "M6 6l12 12M18 6L6 18",
  down: "M6 9l6 6 6-6",
  back: "M15 6l-6 6 6 6",
  pen: "M4 20l4-1 11-11-3-3L5 16z",
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The first Chinese character of a name, else its first letter, else a fallback. */
export function initial(name: string, fallback = "?"): string {
  return name.match(/[㐀-鿿]/)?.[0] ?? name.match(/[A-Za-z0-9]/)?.[0]?.toUpperCase() ?? fallback;
}

export function Avatar({ name, me = false, tiny = false }: { name: string; me?: boolean; tiny?: boolean }) {
  return (
    <span className={["avatar", me && "me", tiny && "tiny"].filter(Boolean).join(" ")} aria-hidden="true">
      {initial(name)}
    </span>
  );
}

// Eight grounds for world covers, each light text on it at 4.5:1 or more. A world keeps its colour: it comes from
// its id alone.
const COVERS = ["#8C3B2A", "#2F4A6B", "#8E3550", "#3B5C60", "#4F5866", "#6A4E23", "#3E5530", "#4A3B66"];
export function coverOf(world: Pick<World, "id" | "title">) {
  // A world id is a random UUID: its first digits pick the colour as well as any hash would.
  let hash = parseInt(world.id.slice(0, 8), 16);
  if (Number.isNaN(hash)) for (const ch of world.id) hash = ((hash || 0) * 31 + ch.charCodeAt(0)) >>> 0;
  return { background: COVERS[hash % COVERS.length]!, mark: initial(world.title, lang === "zh" ? "世" : "W") };
}

/** "今天 13:54", "昨天", "3 天前", or the date. */
export function when(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  const time = then.toLocaleTimeString(lang === "zh" ? "zh-CN" : "en", { hour: "2-digit", minute: "2-digit" });
  if (days <= 0) return `${t("Today, at")} ${time}`;
  if (days === 1) return t("Yesterday");
  if (days < 30) return lang === "zh" ? `${days} 天前` : `${days} days ago`;
  return then.toLocaleDateString(lang === "zh" ? "zh-CN" : "en");
}

/** "第 3 局": one more than the highest such number among a world's saves, so a deleted one is not reused. */
export function nextSaveName(saves: Pick<Save, "title">[]): string {
  const taken = saves.map((s) => Number(/^(?:第 ?(\d+) ?局|Game (\d+))$/.exec(s.title)?.slice(1).find(Boolean) ?? 0));
  const n = Math.max(0, ...taken) + 1;
  return lang === "zh" ? `第 ${n} 局` : `Game ${n}`;
}

export const turnLabel = (n: number) => (lang === "zh" ? `第 ${n} 回合` : `Turn ${n}`);

// ── Theme: follows the system unless the player picks day or night; kept in this browser. ──
type Look = "system" | "light" | "dark";
const KEY = "simulora.look";
const readLook = (): Look => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};
const night = matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();
function applyLook() {
  const look = readLook();
  document.documentElement.dataset.theme = look === "system" ? (night.matches ? "dark" : "light") : look;
  for (const listen of listeners) listen();
}
night.addEventListener("change", applyLook);
applyLook();

export function useLook(): [Look, (look: Look) => void] {
  const [look, setLook] = useState(readLook);
  useEffect(() => {
    const update = () => setLook(readLook());
    listeners.add(update);
    return () => void listeners.delete(update);
  }, []);
  return [
    look,
    (next) => {
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // a private window: the choice lasts this page only
      }
      applyLook();
    },
  ];
}

/** One button that steps through 跟随系统 → 日间 → 夜间. */
export function LookButton() {
  const [look, setLook] = useLook();
  const label = { system: t("Follow the system"), light: t("Day"), dark: t("Night") }[look];
  return (
    <button
      type="button"
      className="quiet small"
      title={`${t("Appearance")}: ${label}`}
      aria-label={`${t("Appearance")}: ${label}`}
      onClick={() => setLook(look === "system" ? "light" : look === "light" ? "dark" : "system")}
    >
      <Icon name={look === "system" ? "auto" : look === "light" ? "sun" : "moon"} />
    </button>
  );
}

// ── Reading ──

// What people say, in “”, 「」 or the model's stray "": coloured, so speech stands out from the telling. A quote still
// being written is coloured to its end.
const SPEECH = /(“[^”]*(?:”|$)|「[^」]*(?:」|$)|"[^"]*(?:"|$))/;

export function Paragraphs({ text, caret = false }: { text: string; caret?: boolean }) {
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split(SPEECH).map((part, j) => (j % 2 ? <span key={j} className="speech">{part}</span> : part))}
          {caret && i === paragraphs.length - 1 && <span className="caret" aria-hidden="true" />}
        </p>
      ))}
    </>
  );
}

const DICE = { easy: "Easy", normal: "Normal", hard: "Hard", success: "Success", cost: "Success at a cost", fail: "Failure" };

/** "成功 · 普通 · 掷出 13", then what it meant. */
export function DiceLine({ dice }: { dice: Dice }) {
  return (
    <div className="dice-line">
      <span className={`badge ${dice.outcome}`}>
        <Icon name="dice" />
        {t(DICE[dice.outcome])} · {t(DICE[dice.difficulty])} · {t("rolled")} {dice.roll}
      </span>
      <span className="muted small">{dice.result || dice.what}</span>
    </div>
  );
}

/** Seconds since a moment, ticking, so a long wait shows it is still going. */
export function Elapsed({ since }: { since: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      {t("taken")} {Math.floor((Date.now() - since) / 1000)} {t("s")}
    </>
  );
}

// ── Menus: open under their button; Esc or a click elsewhere closes them; arrows move between items. ──
export function Menu({
  label,
  title,
  className = "small",
  align = "left",
  up = false,
  disabled = false,
  children,
}: {
  label: ReactNode;
  title: string;
  className?: string;
  align?: "left" | "right";
  up?: boolean;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", away);
    // The first item takes the focus, so the keyboard can go on from there.
    wrap.current?.querySelector<HTMLButtonElement>(".menu button")?.focus();
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(wrap.current?.querySelectorAll<HTMLButtonElement>(".menu button:not(:disabled)") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  return (
    <span className="menu-wrap" ref={wrap} onKeyDown={keys}>
      <button
        ref={button}
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={title}
        title={title}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      {open && (
        <span role="menu" className={["menu", align === "right" && "right", up && "up"].filter(Boolean).join(" ")}>
          {children(close)}
        </span>
      )}
    </span>
  );
}

// ── Dialogs: native, so the page behind is inert and Esc closes them. ──
export function Dialog({
  className,
  label,
  onClose,
  children,
}: {
  className: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {children}
    </dialog>
  );
}

/** Asks before something that cannot be undone; "Cancel" has the focus. */
export function Confirm({
  title,
  text,
  action,
  onConfirm,
  onClose,
}: {
  title: string;
  text: string;
  action: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog className="confirm" label={title} onClose={onClose}>
      <div role="alertdialog" aria-label={title}>
        <h2 style={{ fontSize: 17 }}>{title}</h2>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          {text}
        </p>
        <div className="actions">
          <button type="button" autoFocus onClick={onClose}>
            {t("Cancel")}
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {action}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/** A name to type in, for renaming. */
export function Ask({
  title,
  value,
  onDone,
  onClose,
}: {
  title: string;
  value: string;
  onDone: (value: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  return (
    <Dialog className="confirm" label={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onDone(text.trim());
          onClose();
        }}
      >
        <label>
          <span style={{ fontWeight: 600, fontSize: 17 }}>{title}</span>
          <input autoFocus value={text} maxLength={200} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="actions">
          <button type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button type="submit" className="primary">
            {t("Save")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
