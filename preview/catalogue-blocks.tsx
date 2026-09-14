// Lane-owned gallery fixtures (blocks-templates). The router in catalogue-examples.tsx calls this first-match; return undefined to pass.
import { useState, type ReactNode } from "react";
import { SelectorsExample } from "./selectors-examples";
import { SpeechInputExample } from "./native-speech-examples";
import { QueueExample, SocialButtonExample, ToolbarExample } from "./consumer-readiness-examples";
import { NotificationExample } from "./notification-examples";
import { WebPreviewExample } from "./web-preview-example";
import { QuestionnaireExample } from "./questionnaire-example";
import { SettingsExample } from "./settings-example";
import { PersonaExample } from "./persona-example";
import { AgentLimitsExample } from "./agent-limits-example";
import { AgentProgressExample, AgentThinkingExample } from "./agent-activity-example";
import { ChartModesExample } from "./chart-modes-example";
import { AgentTrailsExample } from "./agent-trails-example";
import { FinanceExample } from "./finance-example";
import { ScatterExample } from "./scatter-example";
import { RingsExample } from "./rings-example";
import { SankeyExample } from "./sankey-example";
import { HeatmapExample } from "./heatmap-example";
import { sampleImage } from "./sample-image";
import { HomeDashboardExample } from "./home-dashboard-example";
import { HrManagementExample } from "./hr-management-example";
import { MarketingDashboardExample } from "./marketing-dashboard-example";
import { MedicalProfileExample } from "./medical-profile-example";
import { SharedChartExample, sharedChartExports } from "./shared-chart-example";
import type { ExampleState } from "./examples";
import { ActivityRingsCard, AgentLimitsCard, AgentProgress, AgentThinking, AreaChartCard, AuthCard, AuthMediaCarousel, BarListCard, Color, ComboChartCard, ContributionsCard, EarningsChartCard, FinanceDashboard, FunnelChartCard, HeatmapChartCard, HomeDashboard, HrManagement, LineChartCard, MarketingDashboard, MedicalProfile, MostActiveDaysCard, Notification, NotificationCenter, OpenIn, OpenInChatGPT, OpenInClaude, OpenInContent, OrdersChartCard, Persona, RadarChartCard, RadialChartCard, RevenueChartCard, Sandbox, SandboxContent, SandboxHeader, SandboxTabContent, SandboxTabs, SandboxTabsBar, SandboxTabsList, SandboxTabsTrigger, SankeyChartCard, ScatterChartCard, SchemaDisplay, SettingsModal, SleepScoreCard, SocialButton, StageBarsCard, StepsCard, TaskList, Typography, WebSearch, JsxPreview } from "@harso/ui";
import { AudioPlayer, AudioPlayerControlBar, AudioPlayerElement, AudioPlayerPlayButton, Canvas, Connection, Controls, Edge, Image, Node, NodeContent, NodeHeader, NodeTitle, Panel, Question, QuestionOption, QuestionOptions, QuestionPrompt, Queue, QueueItem, Toolbar, Transcription, WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewUrl } from "@harso/ui";
import { CanvasExample } from "./canvas-example";
import { RadialRadarExample } from "./radial-radar-example";
function AuthFixture({ state }: { state: ExampleState }) {
  const [submitted, setSubmitted] = useState(false);
  return <AuthCard className="hk-auth-specimen" mode="signin" layout="centered" title="Continue to Harso" description="One calm workspace for your next idea." disabled={state === "disabled"} error={state === "error" ? "This workspace is unavailable. Please try again." : undefined} onSubmitData={() => setSubmitted(true)} footnote={<p role="status">{submitted ? "Local preview complete. No credentials sent or stored." : "Preview only. Use fictional credentials; no account is connected."}</p>} />;
}
const data = [{ label: "Mon", value: 36 }, { label: "Tue", value: 52 }, { label: "Wed", value: 42 }, { label: "Thu", value: 72 }, { label: "Fri", value: 61 }];
const stats = [{ id: "one", label: "Active", value: "24" }, { id: "two", label: "Trend", value: "+18%", trend: "positive" as const }];

export function renderBlocks(component: string, state: ExampleState = "default"): ReactNode | undefined {
  if (component === "SettingsModal") return <SettingsExample state={state} />;
  if (component === "TaskList" || component === "WebSearch") return <AgentTrailsExample component={component} state={state} />;
  if (component === "Questionnaire") return <QuestionnaireExample state={state} />;
  if (component === "Notification" || component === "NotificationCenter") return <NotificationExample component={component} state={state} />;
  if (component === "AgentLimitsCard") return <AgentLimitsExample />;
  if (component === "AgentProgress") return <AgentProgressExample />;
  if (component === "AgentThinking") return <AgentThinkingExample />;
  if (component === "Color") return <section className="hk-foundation-specimen" aria-label="Theme color palette"><header><h2>Color foundations</h2><p>Semantic roles adapt to the active theme. One accent, a quiet surface hierarchy.</p></header><div className="hk-foundation-colors">{[["Canvas", "canvas"], ["Panel", "panel"], ["Surface", "surface"], ["Hover", "hover"], ["Primary text", "ink"], ["Secondary text", "secondary"], ["Accent", "accent"], ["Hairline", "line"]].map(([label, token]) => <div className="hk-foundation-color" key={token}><span className="hk-foundation-paint" style={{ background: `var(--hk-${token})` }} /><strong>{label}</strong><code>--hk-{token}</code></div>)}</div><div className="hk-foundation-surface"><strong>Surfaces create hierarchy</strong><p>A panel sits on the canvas; a surface holds the work. Hairlines separate without competing.</p></div></section>;
  if (component === "Typography") return <section className="hk-foundation-specimen" aria-label="Typography scale"><header><h2>Typography</h2><p>A compact scale for clear, everyday work.</p></header><div className="hk-foundation-type">{[["Display", "24", "600", "A little more clarity."], ["Heading", "20", "600", "Make room for focused work"], ["Section", "16", "600", "Everything in its right place"], ["Body", "15", "400", "Keep the conversation moving. Bring references, decisions, and next steps together in one calm workspace."], ["Interface", "14", "500", "Your workspace is up to date"], ["Technical", "13", "400", "src/workspace.tsx"], ["Metadata", "12", "400", "Updated just now · Visible to your team"]].map(([label, size, weight, sample]) => <div className="hk-foundation-type-row" key={label}><div><strong>{label}</strong><code>{size}px / {weight} / 1.5</code></div><p style={{ fontSize: `var(--hk-text-${({ "24": "heading", "20": "title", "16": "user", "15": "body", "14": "base", "13": "sm", "12": "xs" } as Record<string, string>)[size]})`, fontWeight: Number(weight), fontFamily: label === "Technical" ? "var(--hk-mono)" : undefined }}>{sample}</p></div>)}</div></section>;
  if (component === "AuthCard") return <AuthFixture state={state} />;
  if (component === "FinanceDashboard") return <FinanceExample state={state} />;
  if (component === "HomeDashboard") return <HomeDashboardExample state={state} />;
  if (component === "HrManagement") return <HrManagementExample state={state} />;
  if (component === "MarketingDashboard") return <MarketingDashboardExample state={state} />;
  if (component === "MedicalProfile") return <MedicalProfileExample state={state} />;

  return undefined;
}
