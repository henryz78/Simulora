// What the pages call things: initials, cover colours, save names and times. No browser needed, so it is tested.
import type { Save, World } from "../../shared/types.ts";
import { lang, t } from "./i18n.ts";

/** The first Chinese character of a name, else its first letter, else a fallback. */
export function initial(name: string, fallback = "?"): string {
  return name.match(/[㐀-鿿]/)?.[0] ?? name.match(/[A-Za-z0-9]/)?.[0]?.toUpperCase() ?? fallback;
}

// Eight grounds for world covers, each light text on it at 4.5:1 or more. A world keeps its colour: it comes from
// its id alone.
const COVERS = ["#8C3B2A", "#2F4A6B", "#8E3550", "#3B5C60", "#4F5866", "#6A4E23", "#3E5530", "#4A3B66"];

/** A world's cover: its colour, and the first Chinese character of its title ("世" when there is none). */
export function coverOf(world: Pick<World, "id" | "title">) {
  // A world id is a random UUID: its first digits pick the colour as well as any hash would.
  let hash = parseInt(world.id.slice(0, 8), 16);
  if (Number.isNaN(hash)) {
    hash = 0;
    for (const ch of world.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return { background: COVERS[hash % COVERS.length]!, mark: world.title.match(/[㐀-鿿]/)?.[0] ?? "世" };
}

/** "第 3 局": one more than the highest such number among a world's saves, so a deleted one is not reused. */
export function nextSaveName(saves: Pick<Save, "title">[]): string {
  const taken = saves.map((s) => Number(/^(?:第 ?(\d+) ?局|Game (\d+))$/.exec(s.title)?.slice(1).find(Boolean) ?? 0));
  const n = Math.max(0, ...taken) + 1;
  return lang === "zh" ? `第 ${n} 局` : `Game ${n}`;
}

export const turnLabel = (n: number) =>
  n === 0 ? (lang === "zh" ? "开场" : "Opening") : lang === "zh" ? `第 ${n} 回合` : `Turn ${n}`;

/** "今天 13:54", "昨天", "3 天前", or the date. */
export function when(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const days = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  const time = then.toLocaleTimeString(lang === "zh" ? "zh-CN" : "en", { hour: "2-digit", minute: "2-digit" });
  if (days <= 0) return `${t("Today, at")} ${time}`;
  if (days === 1) return t("Yesterday");
  if (days < 30) return lang === "zh" ? `${days} 天前` : `${days} days ago`;
  return then.toLocaleDateString(lang === "zh" ? "zh-CN" : "en");
}
