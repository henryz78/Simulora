import { zh } from "./i18n-zh.js";

/** The interface speaks Chinese to a browser that prefers it, English otherwise. */
const chinese =
  typeof navigator !== "undefined" &&
  (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase().startsWith("zh");

export const locale = chinese ? "zh-CN" : "en";

/** Interface copy only; World content and generated text keep their own language. */
export function t(text: string): string {
  return (chinese && zh[text]) || text;
}
