import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { lang } from "./i18n.ts";
import { Home } from "./Home.tsx";
import { Play } from "./Play.tsx";
import { Studio } from "./Studio.tsx";
import "./style.css";

/** Routes: #/ · #/studio/new · #/studio/<worldId> · #/play/<saveId> */
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    addEventListener("hashchange", update);
    return () => removeEventListener("hashchange", update);
  }, []);
  const [, page, id = ""] = hash.replace(/^#/, "").split("/");
  if (page === "studio") return <Studio key={id} worldId={id === "new" ? null : id} />;
  if (page === "play") return <Play key={id} saveId={id} />;
  return <Home />;
}

document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
