// Feedback to the admin, on the public site only: a button on every page; and after a turn, when the server says
// so (a new player's 10th point spent, then the 50th), the game asks how it is going.
import { useEffect, useState } from "react";
import { api, type Me } from "./api.ts";
import { t } from "./i18n.ts";
import { Dialog, Icon } from "./ui.tsx";

// Whether this is the public site with someone signed in: asked on each page, since signing in changes no page.
function useSignedIn() {
  const [yes, setYes] = useState(false);
  useEffect(() => {
    let live = true;
    api.me().then((me: Me) => live && setYes(me.mode === "public" && !!me.user), () => {});
    return () => void (live = false);
  }, []);
  return yes;
}

const RATINGS: [number, string][] = [
  [1, "不太行"],
  [2, "还可以"],
  [3, "很喜欢"],
];

/** The button in the top bar; `ask` opens the same dialog by itself, as the game asking. */
export function FeedbackButton({ saveId, ask = false, onAsked }: { saveId?: string; ask?: boolean; onAsked?: () => void }) {
  const signedIn = useSignedIn();
  const [open, setOpen] = useState<"button" | "ask" | null>(null);
  useEffect(() => {
    if (ask && signedIn) setOpen("ask");
  }, [ask, signedIn]);
  if (!signedIn) return null;
  const close = () => {
    setOpen(null);
    onAsked?.();
  };
  return (
    <>
      <button className="quiet small" onClick={() => setOpen("button")} aria-label={t("Feedback")}>
        <Icon name="chat" />
        <span className="wide">{t("Feedback")}</span>
      </button>
      {open && <FeedbackDialog asking={open === "ask"} saveId={saveId} onClose={close} />}
    </>
  );
}

function FeedbackDialog({ asking, saveId, onClose }: { asking: boolean; saveId?: string; onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [state, setState] = useState<"" | "sending" | "sent">("");
  const [error, setError] = useState("");
  const title = asking ? "玩得怎么样？" : "反馈";
  if (state === "sent")
    return (
      <Dialog className="confirm" label={title} onClose={onClose}>
        <h2 style={{ fontSize: 17 }}>收到了，谢谢！</h2>
        <p className="muted">每一条作者都会看。</p>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="primary" onClick={onClose} autoFocus>
            好的
          </button>
        </div>
      </Dialog>
    );
  return (
    <Dialog className="confirm" label={title} onClose={onClose}>
      <form
        className="feedback"
        onSubmit={(e) => {
          e.preventDefault();
          setState("sending");
          setError("");
          api.feedback({ rating, text, page: location.hash, saveId }).then(
            () => setState("sent"),
            (err: Error) => {
              setState("");
              setError(t(err.message));
            },
          );
        }}
      >
        <h2 style={{ fontSize: 17 }}>{title}</h2>
        {asking && (
          <div className="row" role="group" aria-label="打个分">
            {RATINGS.map(([n, label]) => (
              <button type="button" key={n} className="chip" aria-pressed={rating === n} onClick={() => setRating(n)}>
                {label}
              </button>
            ))}
          </div>
        )}
        <label>
          <span className="muted small">
            {asking
              ? "有什么想说的吗？哪里好玩、哪里别扭都行（选填）"
              : "想说什么都可以：哪里看不懂、哪里卡住、哪段剧情不对劲、想要什么功能。"}
          </span>
          <textarea rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} autoFocus={!asking} />
        </label>
        {saveId && <span className="muted small">会附上你这局最近一回合的内容，方便作者看到当时的情况。</span>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="quiet" onClick={onClose}>
            {asking ? "下次再说" : "取消"}
          </button>
          <button className="primary" disabled={state === "sending" || (!text.trim() && rating === null)}>
            发送
          </button>
        </div>
      </form>
    </Dialog>
  );
}
