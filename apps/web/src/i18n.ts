import { zh } from "./i18n-zh.js";

/**
 * The interface speaks Chinese to a browser that prefers it, English otherwise.
 * Read once at load: changing the browser language takes effect on reload.
 * Every zh variant gets Simplified Chinese; there is no Traditional copy yet.
 */
const chinese =
  typeof navigator !== "undefined" &&
  (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase().startsWith("zh");

export const locale = chinese ? "zh-CN" : "en";

/**
 * Interface copy only; World content and generated text keep their own language.
 * `{name}` placeholders are filled from `values` after the lookup.
 */
export function t(text: string, values?: Record<string, string | number>): string {
  const copy = (chinese && zh[text]) || text;
  return values
    ? copy.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match))
    : copy;
}
