import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Library } from "./Library";
import { ChatRoutePage, chatRouteFromHash } from "./ChatRoutes";
import "@harso/ui/styles.css";
import "./library.css";

function App() {
  const [chatRoute, setChatRoute] = useState(chatRouteFromHash);
  useEffect(() => {
    const update = () => setChatRoute(chatRouteFromHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return chatRoute ? <ChatRoutePage key={chatRoute} route={chatRoute} /> : <Library />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
