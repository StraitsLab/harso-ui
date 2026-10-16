import { useState } from "react";
import { createRoot } from "react-dom/client";
import { HarsoOutputCard, KitProvider, type HarsoOutputDocument } from "@harso/ui";
import "@harso/ui/styles.css";

const document: HarsoOutputDocument = {
  header: { title: "Plan the next trip", subtitle: "Illustrative answer · no booking is made" },
  blocks: [
    { kind: "text", tone: "warning", sections: [{ paragraphs: ["Prices can change. Confirm the dates before booking."] }] },
    { kind: "visual", visual: { kind: "chart", chart: "area", unit: "S$ per night", x_labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], series: [{ label: "Hotel prices", values: ["120", "132", "125", "152", "140"] }] } },
    { kind: "form", submit: "Plan trip", fields: [
      { id: "city", label: "Destination", type: "text", value: "Kyoto", required: true },
      { id: "mode", label: "Travel", type: "choice", options: ["Train", "Plane"], value: "Train" },
      { id: "date", label: "Departure", type: "date", value: "2026-10-20" },
      { id: "people", label: "People", type: "number", value: "2" },
    ] },
  ],
  suggestions: ["What about next week?", "Find quieter places"],
  fallback_text: "Plan a trip to Kyoto. Hotel prices range from S$120 to S$152 per night.",
};
function Preview() {
  const [reply, setReply] = useState("");
  const dark = new URLSearchParams(location.search).get("dark") === "1";
  return <KitProvider appearance={dark ? "dark" : "light"} style={{ minHeight: "100vh", background: "var(--hk-canvas)", color: "var(--hk-ink)", padding: 32, boxSizing: "border-box" }}>
    <main style={{ maxWidth: 520, margin: "0 auto" }}><HarsoOutputCard document={document} onViewAll={() => undefined} onReply={setReply} />
      {reply && <p role="status">Sent: {reply}</p>}
    </main>
  </KitProvider>;
}
createRoot(window.document.getElementById("root")!).render(<Preview />);
