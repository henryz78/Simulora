import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { lang } from "./i18n.ts";
import { Play } from "./Play.tsx";
import { Create, Explore, Home, Mine, SamplePage } from "./Site.tsx";
import { Studio } from "./Studio.tsx";
import { World } from "./World.tsx";
import "./style.css";
import "./ui.tsx"; // sets the day or night look before the first paint

/**
 * Routes: #/ · #/explore[?q=&tag=] · #/explore/<sampleId> · #/create · #/me · #/world/<worldId> ·
 * #/studio/new[/manual] · #/studio/<worldId> · #/play/<saveId>
 */
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    addEventListener("hashchange", update);
    return () => removeEventListener("hashchange", update);
  }, []);
  const [path = "", query] = hash.replace(/^#/, "").split("?");
  const [, page, id = "", more] = path.split("/");
  if (page === "studio")
    return <Studio key={id + more} worldId={id === "new" ? null : id} manual={more === "manual"} />;
  if (page === "play") return <Play key={id} saveId={id} />;
  if (page === "world") return <World key={id} worldId={id} />;
  if (page === "explore") return id ? <SamplePage key={id} id={id} /> : <Explore query={new URLSearchParams(query)} />;
  if (page === "create") return <Create />;
  if (page === "me") return <Mine />;
  return <Home />;
}

document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
