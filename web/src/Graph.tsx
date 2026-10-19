import { useState } from "react";
import type { WorldState } from "../../shared/types.ts";
import { t } from "./i18n.ts";

/**
 * The people with ties, on a circle, a line for each tie: pick someone to light their lines and read how they stand
 * with each. Hand-drawn in SVG; a dozen or two people is what a story holds.
 */
export function Graph({ state, me, onClose }: { state: WorldState; me: string | null; onClose: () => void }) {
  const [picked, setPicked] = useState<string | null>(me);
  const tied = new Set(state.relationships.flatMap((r) => [r.a, r.b]));
  const people = state.characters.filter((c) => tied.has(c.id));
  const size = 520;
  const r = size / 2 - 90;
  const at = new Map(
    people.map((c, i) => {
      const angle = (i / people.length) * 2 * Math.PI - Math.PI / 2;
      return [c.id, { x: size / 2 + r * Math.cos(angle), y: size / 2 + r * Math.sin(angle) }];
    }),
  );
  const name = (id: string) => state.characters.find((c) => c.id === id)?.name ?? "?";
  const mine = state.relationships.filter((x) => x.a === picked || x.b === picked);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="graph" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <h2>{t("Relationship map")}</h2>
          <button className="link" onClick={onClose} aria-label={t("Close")}>
            ✕
          </button>
        </div>
        {people.length === 0 ? (
          <p className="muted">{t("No ties recorded yet.")}</p>
        ) : (
          <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={t("Relationship map")}>
            {state.relationships.map((x, i) => {
              const a = at.get(x.a);
              const b = at.get(x.b);
              if (!a || !b || a === b) return null; // a tie to no one known, or to oneself, is not drawn
              const lit = x.a === picked || x.b === picked;
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={lit ? "tie lit" : "tie"}>
                  <title>{`${name(x.a)} · ${name(x.b)}：${x.text}`}</title>
                </line>
              );
            })}
            {people.map((c) => {
              const p = at.get(c.id)!;
              const cls = ["person", c.id === me && "me", c.id === picked && "picked", c.gone && "gone"].filter(Boolean);
              return (
                <g key={c.id} className={cls.join(" ")} onClick={() => setPicked(c.id)} tabIndex={0}>
                  <circle cx={p.x} cy={p.y} r={8} />
                  <text x={p.x} y={p.y + (p.y > size / 2 ? 24 : -14)} textAnchor="middle">
                    {c.name.split(/[·・]/)[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        {picked && mine.length > 0 && (
          <ul>
            {mine.map((x, i) => (
              <li key={i}>
                <strong>{name(x.a === picked ? x.b : x.a)}</strong>：{x.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
