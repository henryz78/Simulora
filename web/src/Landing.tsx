// The front page for a visitor on the public site, not signed in: what Simulora is, the sample worlds, and the way in.
import type { SampleSummary } from "../../shared/types.ts";
import { t } from "./i18n.ts";
import { SampleCard, Site } from "./Site.tsx";
import { homeArt } from "./ui.tsx";

const FEATURES: [string, string][] = [
  ["Write what you want to do", "No menu of choices: a line, an action, a few words of dialogue, and the story carries on from what you wrote."],
  ["People with minds of their own", "Everyone has aims and secrets, and remembers what you did. While you are elsewhere, they go on acting."],
  ["Hundreds of turns, nothing forgotten", "A long memory and a timeline: a hint dropped early comes back long after."],
  ["See the story another way", "Watch a scene again through someone else's eyes, ask a character a few questions, or turn the whole game into a novel."],
];

const STEPS: [string, string][] = [
  ["Pick a world", "Start from a sample, or describe one in a sentence and let the AI build it."],
  ["Write your move", "Speak, act, probe: anything goes. Unsure? Suggestions are a click away."],
  ["Watch it unfold", "Look back at any time, rewrite, or branch off from any turn into another path."],
];

function JoinButtons() {
  return (
    <div className="row">
      <a className="button primary" href="#/join">
        {t("Have an invite? Join the beta")}
      </a>
      <a className="button" href="#/login">
        {t("Sign in")}
      </a>
    </div>
  );
}

export function Landing({ samples }: { samples: SampleSummary[] | null }) {
  return (
    <Site page="home" title="">
      <div className="site-page landing">
        <section className="welcome hero" style={{ backgroundImage: `var(--welcome-shade), url(${homeArt})` }}>
          <h1 className="serif">{t("Step into a story world that runs on its own")}</h1>
          <p className="muted">
            {t(
              "Pick a world and play one of its people. Write what you do, and the AI writes the story on: everyone has plans of their own, secrets wait in the dark, and what was hinted early comes back late.",
            )}
          </p>
          <JoinButtons />
          <a className="small" href="#/explore" style={{ color: "inherit" }}>
            {t("Or look around the worlds first")} →
          </a>
        </section>

        <section className="site-section" aria-labelledby="why">
          <h2 id="why" className="serif">
            {t("Not a chat, a world")}
          </h2>
          <div className="features">
            {FEATURES.map(([head, text]) => (
              <div key={head}>
                <h3 className="serif">{t(head)}</h3>
                <p className="muted">{t(text)}</p>
              </div>
            ))}
          </div>
        </section>

        {samples && samples.length > 0 && (
          <section className="site-section" aria-labelledby="worlds">
            <h2 id="worlds" className="serif">
              {t("Worlds to start from")}
            </h2>
            <div className="shelf">
              {samples.map((s) => (
                <SampleCard key={s.id} sample={s} mine={false} />
              ))}
            </div>
          </section>
        )}

        <section className="site-section" aria-labelledby="how">
          <h2 id="how" className="serif">
            {t("How it plays")}
          </h2>
          <ol className="steps">
            {STEPS.map(([head, text]) => (
              <li key={head}>
                <b>{t(head)}</b>
                <span className="muted">{t(text)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="join-cta" aria-labelledby="join">
          <h2 id="join" className="serif">
            {t("An invite-only beta, for now")}
          </h2>
          <p className="muted">{t("Free points every day, about one per turn. An invite code is all it takes.")}</p>
          <JoinButtons />
          <a className="muted small" href="#/privacy">
            {t("Privacy")}
          </a>
        </section>
      </div>
    </Site>
  );
}
