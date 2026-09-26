import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Library } from "./Library";
import { ChatRoutePage, chatRouteFromHash } from "./ChatRoutes";
import { CataloguePage, catalogueRouteFromHash } from "./catalogue-gallery";
import "@harso/ui/styles.css";
import "./library.css";

function App() {
  const [chatRoute, setChatRoute] = useState(chatRouteFromHash);
  const [catalogueRoute, setCatalogueRoute] = useState(catalogueRouteFromHash);
  useEffect(() => {
    const update = () => { setChatRoute(chatRouteFromHash()); setCatalogueRoute(catalogueRouteFromHash()); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (catalogueRoute) return <CataloguePage {...catalogueRoute} />;
  return chatRoute ? <ChatRoutePage key={chatRoute} route={chatRoute} /> : <Library />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
