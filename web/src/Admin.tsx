// The admin page: today's use, the invites, the players, and what went wrong lately.
// It has one reader, the site's admin, so it is written in Chinese only.
import { useEffect, useState } from "react";
import { api, type AdminView } from "./api.ts";
import { t } from "./i18n.ts";
import { Site } from "./Site.tsx";

const at = (ms: number) => new Date(ms).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const num = (n: number) => String(Number(n.toFixed(1)));

export function Admin() {
  const [view, setView] = useState<AdminView | null>(null);
  const [error, setError] = useState("");
  const [count, setCount] = useState("5");
  const [copied, setCopied] = useState("");
  const load = () => api.admin().then(setView, (e: Error) => setError(t(e.message)));
  useEffect(() => void load(), []);
  // Every change reloads the page's data, so what it shows is what the server holds.
  const act = (work: Promise<unknown>) => {
    setError("");
    return work.then(load, (e: Error) => setError(t(e.message)));
  };
  const copy = (code: string) =>
    navigator.clipboard.writeText(`${location.origin}/#/join/${code}`).then(
      () => setCopied(code),
      () => setError("复制失败，请手动复制邀请码"),
    );

  return (
    <Site page="me" title="管理后台">
      <div className="site-page admin">
        <h1 className="serif">管理后台</h1>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!view && !error && <p className="muted">加载中…</p>}
        {view && (
          <>
            <section className="stats" aria-label="今天">
              <div>
                <span className="muted small">今天的模型请求</span>
                <b>
                  {view.calls.today}
                  {view.calls.limit !== null && <span className="muted"> / {view.calls.limit}</span>}
                </b>
              </div>
              <div>
                <span className="muted small">今天的验证码请求</span>
                <b>
                  {view.mail.asked}
                  <span className="muted"> / {view.mail.limit}</span>
                </b>
              </div>
              <div>
                <span className="muted small">玩家</span>
                <b>{view.users.length}</b>
              </div>
            </section>

            <section className="list" aria-labelledby="week">
              <h2 id="week" className="serif">
                最近 7 天
              </h2>
              <p className="muted small">每天有几个玩家用过点数、一共用了多少点（一个回合约 1 点）。包括你自己。</p>
              <table className="week">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>玩家</th>
                    <th>点数</th>
                  </tr>
                </thead>
                <tbody>
                  {view.daily.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day.slice(5).replace("-", "/")}</td>
                      <td>{d.players}</td>
                      <td>{num(d.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="list" aria-labelledby="feedback">
              <h2 id="feedback" className="serif">
                反馈
              </h2>
              {view.feedback.length === 0 && <p className="muted list-row">还没有反馈。</p>}
              {view.feedback.map((f) => (
                <div className="list-row feedback-row" key={f.id}>
                  <span className="muted small">
                    {f.email} · {at(f.at)}
                    {f.rating !== null && <> · <b>{["", "不太行", "还可以", "很喜欢"][f.rating]}</b>（游戏询问时）</>}
                  </span>
                  {f.text && <p>{f.text}</p>}
                  {f.context && (
                    <details>
                      <summary className="muted small">当时的情况</summary>
                      <p className="small" style={{ whiteSpace: "pre-wrap" }}>{f.context}</p>
                    </details>
                  )}
                </div>
              ))}
            </section>

            <section className="list" aria-labelledby="invites">
              <h2 id="invites" className="serif">
                邀请码
              </h2>
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(api.createInvites(Number(count)));
                }}
              >
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  aria-label="生成几个"
                  style={{ width: 80 }}
                />
                <button className="primary">生成邀请码</button>
                <span className="muted small">每个码只能注册一个账号。把“复制链接”得到的链接发给对方，点开就能注册。</span>
              </form>
              {view.invites.length === 0 && <p className="muted list-row">还没有邀请码。</p>}
              {view.invites.map((i) => {
                const open = !i.usedBy && !i.revoked;
                return (
                  <div className="list-row" key={i.code}>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <code className={open ? "" : "muted"}>{i.code}</code>
                      <br />
                      <span className="muted small">
                        {i.revoked
                          ? "已作废"
                          : i.usedBy
                            ? `已被 ${i.usedBy} 使用 · ${at(i.usedAt!)}`
                            : i.heldFor
                              ? `${i.heldFor} 已申请验证码，还没完成注册`
                              : `未使用 · ${at(i.createdAt)} 生成`}
                      </span>
                    </div>
                    {open && (
                      <>
                        <button className="small" onClick={() => void copy(i.code)}>
                          {copied === i.code ? "已复制" : "复制链接"}
                        </button>
                        <button
                          className="small quiet danger-text"
                          onClick={() => confirm(`作废邀请码 ${i.code}？`) && void act(api.revokeInvite(i.code))}
                        >
                          作废
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="list" aria-labelledby="players">
              <h2 id="players" className="serif">
                玩家
              </h2>
              {view.users.map((u) => (
                <Player key={`${u.id}:${u.ownPoints}`} user={u} act={act} />
              ))}
            </section>

            <section className="list" aria-labelledby="problems">
              <h2 id="problems" className="serif">
                最近的问题
              </h2>
              <p className="muted small">服务器最近的 50 条警告，比如模型请求失败、邮件没发出去。服务重启后会清空。</p>
              {view.problems.length === 0 && <p className="muted list-row">没有。</p>}
              {view.problems.map((p, n) => (
                <div className="list-row problem" key={n}>
                  <span className="muted small">{at(p.at)}</span>
                  <code>{p.text}</code>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </Site>
  );
}

function Player({ user: u, act }: { user: AdminView["users"][number]; act: (work: Promise<unknown>) => Promise<unknown> }) {
  const [points, setPoints] = useState(u.ownPoints === null ? "" : String(u.ownPoints));
  const admin = u.role === "admin";
  const active = u.status === "active";
  const changed = points.trim() !== (u.ownPoints === null ? "" : String(u.ownPoints));
  return (
    <div className="list-row">
      <div className="grow" style={{ minWidth: 0 }}>
        <b>{u.email}</b> {admin && <span className="tag">管理员</span>}
        {!active && <span className="tag">已停用</span>}
        <br />
        <span className="muted small">
          今天用了 {num(u.points.used)}
          {u.points.limit !== null && ` / ${num(u.points.limit)}`} 点 · {u.worlds} 个世界 · {at(u.createdAt)} 加入 ·{" "}
          {u.lastDay ? `玩过 ${u.days} 天，最近 ${u.lastDay.slice(5).replace("-", "/")}` : "还没玩过"}
        </span>
      </div>
      {!admin && (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void act(api.setPlayer(u.id, { points: points.trim() === "" ? null : Number(points) }));
          }}
        >
          <input
            type="number"
            min={0}
            max={1000}
            placeholder="默认"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            aria-label={`${u.email} 每天的点数`}
            style={{ width: 80 }}
          />
          <button className="small" disabled={!changed}>
            设为每日点数
          </button>
          <button
            type="button"
            className={active ? "small quiet danger-text" : "small"}
            onClick={() =>
              (!active || confirm(`停用 ${u.email}？对方会马上被登出，之后也登不进来。`)) &&
              void act(api.setPlayer(u.id, { active: !active }))
            }
          >
            {active ? "停用" : "恢复"}
          </button>
        </form>
      )}
    </div>
  );
}
