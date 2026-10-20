import { useState } from "react";
import type { WorldState } from "../../shared/types.ts";
import { lang, t } from "./i18n.ts";
import { Dialog, Icon, initial } from "./ui.tsx";

/**
 * The people with ties, on a circle, a line for each tie: pick someone, on the map or in the list under it, to light
 * their lines and read how they stand with each. Hand-drawn in SVG; a dozen or two people is what a story holds.
 */
export function Graph({ state, me, onClose }: { state: WorldState; me: string | null; onClose: () => void }) {
  const [picked, setPicked] = useState<string | null>(me);
  const tied = new Set(state.relationships.flatMap((r) => [r.a, r.b]));
  const people = state.characters.filter((c) => tied.has(c.id));
  const size = 520;
  const r = size / 2 - 120;
  // Each name sits outside the circle, beyond its person, clear of the lines.
  const at = new Map(
    people.map((c, i) => {
      const angle = (i / people.length) * 2 * Math.PI - Math.PI / 2;
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      const anchor = cos > 0.12 ? ("start" as const) : cos < -0.12 ? ("end" as const) : ("middle" as const);
      return [
        c.id,
        {
          x: size / 2 + r * cos,
          y: size / 2 + r * sin,
          lx: size / 2 + (r + 26) * cos,
          ly: size / 2 + (r + 26) * sin + 5,
          anchor,
        },
      ];
    }),
  );
  const name = (id: string) => state.characters.find((c) => c.id === id)?.name ?? "?";
  const mine = state.relationships.filter((x) => x.a === picked || x.b === picked);
  const sep = lang === "zh" ? "：" : ": ";

  return (
    <Dialog className="graph" label={t("Relationship map")} onClose={onClose}>
      <div className="dialog-head">
        <span>{t("Relationship map")}</span>
        <button className="quiet small" onClick={onClose} aria-label={t("Close")}>
          <Icon name="close" />
        </button>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {people.length === 0 ? (
          <p className="muted">{t("No ties recorded yet.")}</p>
        ) : (
          <>
            <svg viewBox={`-80 0 ${size + 160} ${size}`} role="img" aria-label={t("Relationship map")}>
              {state.relationships.map((x, i) => {
                const a = at.get(x.a);
                const b = at.get(x.b);
                if (!a || !b || a === b) return null; // a tie to no one known, or to oneself, is not drawn
                const lit = x.a === picked || x.b === picked;
                return (
                  <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={lit ? "tie lit" : "tie"}>
                    <title>{`${name(x.a)} · ${name(x.b)}${sep}${x.text}`}</title>
                  </line>
                );
              })}
              {people.map((c) => {
                const p = at.get(c.id)!;
                const cls = ["node", c.id === me && "me", c.id === picked && "picked", c.gone && "gone"].filter(
                  Boolean,
                );
                return (
                  <g key={c.id} className={cls.join(" ")} onClick={() => setPicked(c.id)} style={{ cursor: "pointer" }}>
                    <circle cx={p.x} cy={p.y} r={18} />
                    <text className="mark" x={p.x} y={p.y + 5} textAnchor="middle">
                      {initial(c.name)}
                    </text>
                    <text className="name" x={p.lx} y={p.ly} textAnchor={p.anchor}>
                      {c.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* The same people as buttons: the keyboard's way to the map. */}
            <div className="row" style={{ gap: 6 }} role="group" aria-label={t("Pick someone")}>
              {people.map((c) => (
                <button
                  key={c.id}
                  className={c.id === picked ? "small on" : "small"}
                  aria-pressed={c.id === picked}
                  onClick={() => setPicked(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}
        {picked && mine.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="muted small">
              {name(picked)} · {lang === "zh" ? `${mine.length} 条关系` : `${mine.length} ties`}
            </span>
            {mine.map((x, i) => (
              <span key={i} style={{ fontSize: 14 }}>
                <b style={{ fontWeight: 600 }}>{name(x.a === picked ? x.b : x.a)}</b> · {x.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
