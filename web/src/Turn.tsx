import { useState } from "react";
import type { Change, Character, NodeSummary, TurnNode, WorldState } from "../../shared/types.ts";
import { lang, t } from "./i18n.ts";
import { Avatar, DiceLine, Icon, Menu, Paragraphs } from "./ui.tsx";

const sep = lang === "zh" ? "：" : ": ";

export const actorLabel = (state: WorldState, actor: string) =>
  actor === "director" ? t("Director") : (state.characters.find((c) => c.id === actor)?.name ?? "?");

/** Words for a change the model left without a note. */
function describe(c: Change): string {
  switch (c.type) {
    case "move":
      return `${c.character} → ${c.place}`;
    case "place":
      return c.name;
    case "character":
      return c.name;
    case "leave":
      return `${c.character} ${t("left the story")}${c.note ? `${sep}${c.note}` : ""}`;
    case "status":
      return `${c.character}${sep}${c.notes}`;
    case "persona":
      return `${c.character}${sep}${c.persona || c.goals}`;
    case "fact":
      return c.text;
    case "reveal":
      return t("Revealed");
    case "learn":
      return `${c.character} ${t("learned something")}`;
    case "relationship":
      return `${c.a} · ${c.b}${sep}${c.text}`;
    case "thread":
      return c.title;
    case "resolve":
      return c.resolution;
    case "clock":
      return c.text;
  }
}

/**
 * Who a turn's scene can be seen through: the people its story names, not the one the player played, and only those
 * there: one merely spoken of was given a scene of their own, made up (2026-10-20). Someone placed nowhere may be there.
 */
export const seenIn = (node: TurnNode, state: WorldState) => {
  const at = node.state ?? state;
  const here = at.characters.find((c) => c.id === node.actor)?.placeId ?? null;
  return at.characters.filter(
    (c) =>
      c.id !== node.actor &&
      !c.gone &&
      (!here || !c.placeId || c.placeId === here) &&
      [c.name, ...c.name.split(/[·・\s]+/)].some((part) => part.length >= 2 && node.story.includes(part)),
  );
};

/** The turn's opening line: who acted and how, or the opening, or the days the world lived alone. */
export function ActorLine({
  node,
  index,
  state,
}: {
  node: { actor: string; input: string; offline?: "world" | "all" | null };
  index: number;
  state: WorldState;
}) {
  if (index === 0) return <span className="label">{t("Opening")}</span>;
  if (node.offline)
    return (
      <div className="row">
        <span className="badge plain">
          {t("While you were away")} · {node.input}
        </span>
        <span className="muted small">
          {node.offline === "all"
            ? t("the whole world lived those days, your character too")
            : t("the world lived those days; your character stayed")}
        </span>
      </div>
    );
  const name = actorLabel(state, node.actor);
  return (
    <div className="actor-line">
      {node.actor === "director" ? (
        <span className="avatar" aria-hidden="true">
          <Icon name="pen" size={14} />
        </span>
      ) : (
        <Avatar name={name} me />
      )}
      <span>
        <span className="muted">{name} · </span>
        {node.input || <span className="muted">{t("Let it unfold")}</span>}
      </span>
    </div>
  );
}

export interface TurnTools {
  busy: boolean;
  resumable: (id: string) => boolean;
  /** Other ways the story went on from this turn. */
  others: NodeSummary[];
  goTo: (id: string) => void;
  goToLatest: (id: string) => void;
  branch: (id: string) => void;
  /** On the newest turn: take it back. */
  undo?: () => void;
  /** Another's eyes: what is shown for this turn, and whether it is being written. */
  view?: { who: string; story: string };
  viewing: boolean;
  seeAs: (who: string) => void;
  playAs: (who: string) => void;
  openBook: () => void;
}

/** One turn: who acted, the die, the story, what it uncovered, and what can be done with it. */
export function Turn({
  node,
  index,
  state,
  head,
  compact = false,
  tools,
  extra,
}: {
  node: TurnNode;
  index: number;
  state: WorldState;
  head: boolean;
  compact?: boolean;
  tools: TurnTools;
  /** Shown between the story and its tools: "record again" on the newest turn. */
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState<"changes" | "meanwhile" | null>(null);
  const [hideView, setHideView] = useState(false);
  const seen: Character[] = index > 0 ? seenIn(node, state) : [];
  const secrets = state.facts.filter((f) => f.secret);
  const found = node.changes.flatMap((c) => {
    const fact = c.type === "reveal" && state.facts.find((f) => f.id === c.fact);
    return fact ? [fact] : [];
  });
  const canResume = tools.resumable(node.id);
  const toggle = (what: "changes" | "meanwhile") => setOpen(open === what ? null : what);

  return (
    <article style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 18 }}>
      {!compact && <ActorLine node={node} index={index} state={state} />}
      {node.dice && <DiceLine dice={node.dice} />}
      <div className="story">
        <Paragraphs text={node.story} />
      </div>

      {found.map((fact) => (
        <div className="note secret" role="status" key={fact.id}>
          <b className="row" style={{ gap: 8 }}>
            <Icon name="unlock" />
            {t("A secret comes out")} · {t("found")} {secrets.filter((f) => f.revealed).length} / {secrets.length}
          </b>
          <p className="serif" style={{ fontSize: 17, lineHeight: 1.8 }}>
            {fact.text}
          </p>
          <span className="muted small">
            {fact.revealNote && `${t("How it came out")}${sep}${fact.revealNote} · `}
            {t(fact.source === "ai" ? "Buried by the AI" : "Yours")}
          </span>
          <div>
            <button className="small" onClick={tools.openBook}>
              {t("See the discovery book")}
            </button>
          </div>
        </div>
      ))}

      {extra}

      {open === "changes" && (
        <ul className="list-plain">
          {node.changes.map((c, j) => (
            // A leave's note says why, not who.
            <li key={j}>{c.type === "leave" ? describe(c) : c.note || describe(c)}</li>
          ))}
        </ul>
      )}
      {open === "meanwhile" && node.meanwhile && (
        <div className="note meanwhile">
          {node.meanwhile.map((m, j) => (
            <div key={j}>
              <Avatar name={m.character} />
              <span>
                <b style={{ fontWeight: 600 }}>{m.character}</b> <span className="muted">{m.did}</span>
              </span>
            </div>
          ))}
          <span className="muted small">{t("Your character does not know this; the suggestions never use it.")}</span>
        </div>
      )}
      {tools.view && !hideView && (
        <div className="note">
          <b style={{ fontSize: 14 }}>
            {lang === "zh"
              ? `${state.characters.find((c) => c.id === tools.view!.who)?.name ?? ""}眼里的这一幕`
              : `Through the eyes of ${state.characters.find((c) => c.id === tools.view!.who)?.name ?? ""}`}{" "}
            <span className="muted" style={{ fontWeight: 400 }}>
              · {t("kept")}
            </span>
          </b>
          <div className="story" style={{ fontSize: 15 }}>
            <Paragraphs text={tools.view.story} />
          </div>
          <div className="row">
            {!tools.busy && (
              <button className="small" onClick={() => tools.playAs(tools.view!.who)}>
                {t("Play on as them")}
              </button>
            )}
            <button className="quiet small" onClick={() => setHideView(true)}>
              {t("Fold")}
            </button>
          </div>
        </div>
      )}

      {!tools.busy && (
        <div
          role="toolbar"
          aria-label={t("This turn")}
          className="toolbar"
          style={compact ? { borderBottom: 0, paddingBottom: 0 } : undefined}
        >
          {node.changes.length > 0 && (
            <button
              className={open === "changes" ? "small on" : "small"}
              aria-expanded={open === "changes"}
              onClick={() => toggle("changes")}
            >
              {t("Changes")} {node.changes.length}
            </button>
          )}
          {node.meanwhile && node.meanwhile.length > 0 && (
            <button
              className={open === "meanwhile" ? "small on" : "small"}
              aria-expanded={open === "meanwhile"}
              onClick={() => toggle("meanwhile")}
            >
              {t("Meanwhile")} {node.meanwhile.length}
            </button>
          )}
          {seen.length > 0 && (
            <Menu
              label={<>{tools.viewing ? t("Writing…") : t("Another's eyes")} ▾</>}
              title={t("Another's eyes")}
              disabled={tools.viewing}
            >
              {(close) =>
                seen.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    role="menuitem"
                    onClick={() => {
                      close();
                      setHideView(false);
                      tools.seeAs(c.id);
                    }}
                  >
                    <Avatar name={c.name} tiny />
                    {c.name}
                  </button>
                ))
              }
            </Menu>
          )}
          {tools.others.length > 0 && (
            <Menu
              label={
                <>
                  {t("Other paths")} {tools.others.length} ▾
                </>
              }
              title={t("Other paths")}
            >
              {(close) =>
                tools.others.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    role="menuitem"
                    onClick={() => {
                      close();
                      tools.goToLatest(o.id);
                    }}
                  >
                    {o.input.slice(0, 24) || t("Let it unfold")}
                  </button>
                ))
              }
            </Menu>
          )}
          {compact ? (
            canResume ? (
              <>
                {!head && (
                  <button className="small" onClick={() => tools.goTo(node.id)}>
                    {t("Go back here")}
                  </button>
                )}
                <button className="small" onClick={() => tools.branch(node.id)}>
                  {t("Branch from here")}
                </button>
              </>
            ) : null
          ) : (
            (canResume || tools.undo) && (
              <Menu
                label={<>{t("More")} ⋯</>}
                title={t("More: go back here, branch from here")}
                className="quiet small"
              >
                {(close) => (
                  <>
                    {tools.undo && (
                      <button type="button" role="menuitem" onClick={() => (close(), tools.undo!())}>
                        {t("Undo last turn")}
                      </button>
                    )}
                    {!head && canResume && (
                      <button type="button" role="menuitem" onClick={() => (close(), tools.goTo(node.id))}>
                        {t("Go back here")}
                      </button>
                    )}
                    {canResume && (
                      <button type="button" role="menuitem" onClick={() => (close(), tools.branch(node.id))}>
                        {t("Branch from here")}
                      </button>
                    )}
                  </>
                )}
              </Menu>
            )
          )}
        </div>
      )}
    </article>
  );
}
