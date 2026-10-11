import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument } from "../src/chat/output-card";
import { family } from "../src/chat/v6/weather";
import type { V6Weather, WidgetSize } from "../src/chat/v6/types";
import "../src/primitives.css";

// P04 (WEV-3320) fixture: the approved Singapore answer, every sky, the three widget sizes, a gap and a card with no forecast.
// No transport, no host: every callback is a no-op.
const labels = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const full: V6Weather = {
  sky: "storm", current_condition: "partly", high: "32", low: "26",
  hourly: [{ condition: "partly", rain: 10 }, { condition: "partly", rain: 20 }, { condition: "cloudy", rain: 35 }, { condition: "storm", rain: 70 }, { condition: "rain", rain: 70 }, { condition: "rain", rain: 60 }],
  days: [
    { label: "Today", condition: "storm", low: "26", high: "32" }, { label: "Sun", condition: "rain", low: "26", high: "31" },
    { label: "Mon", condition: "partly", low: "25", high: "32" }, { label: "Tue", condition: "storm", low: "26", high: "30" },
    { label: "Wed", condition: "partly", low: "26", high: "33" }
  ]
};
const doc = (weather: V6Weather, values: (string | null)[] = ["31", "32", "32", "28", "27", "27"], subtitle = "Thunderstorms later"): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "weather-now", header: { title: "Singapore", subtitle }, as_of: "2026-10-11T04:05Z", weather,
  blocks: [
    { kind: "numbers", items: [{ value: "31°C", label: "Now" }, { value: "70%", label: "Rain after 3 pm" }] },
    { kind: "visual", visual: { kind: "chart", chart: "line", unit: "°C", x_labels: labels, series: [{ label: "Temperature", values }] } }
  ],
  details: { sources: [{ label: "NEA weather forecast", url: "https://www.nea.gov.sg/weather" }] },
  fallback_text: "Singapore, 31°C now."
});
const skies = [["clear-day", "clear"], ["clear-night", "night"], ["cloudy", "cloudy"], ["rain", "rain"]] as const;
const families = { "weather-now": family };
const Card = ({ title, document, widgetSize, cls = "" }: { title: string; document: HarsoOutputDocument; widgetSize?: WidgetSize; cls?: string }) =>
  <div className={`slot ${cls}`} data-testid={title}><h2>{title}</h2><HarsoOutputCard document={document} families={families} widgetSize={widgetSize} onViewAll={() => {}} /></div>;

const appearance = new URLSearchParams(location.search).get("mode") === "dark" ? "dark" : "light";
createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="weather-fixture">
    <main>
      <Card title="card" document={doc(full)} />
      <Card title="widget small" document={doc(full)} widgetSize="small" cls="s" />
      <Card title="widget medium" document={doc(full)} widgetSize="medium" cls="m" />
      <Card title="widget large" document={doc(full)} widgetSize="large" cls="l" />
      {skies.map(([sky, current]) => <Card key={sky} title={sky} document={doc({ ...full, sky, current_condition: current }, undefined, "")} />)}
      <Card title="gap, equal range, no days" document={doc({ sky: "cloudy", current_condition: "cloudy", high: "29", low: "29", hourly: full.hourly }, ["31", null, "32", "28", "27", "27"])} />
      <Card title="no sky, no forecast" document={doc({ high: "31", low: "26" })} />
    </main>
  </KitProvider>
);
