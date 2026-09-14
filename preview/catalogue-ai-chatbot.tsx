// Lane-owned gallery fixtures (ai-chatbot). The router in catalogue-examples.tsx calls this first-match; return undefined to pass.
import { useState, type ReactNode } from "react";
import { OpenInTrigger, OpenInLabel, QuestionDescription, QuestionActions, QuestionSubmit, QuestionInput } from "@harso/ui";
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
const data = [{ label: "Mon", value: 36 }, { label: "Tue", value: 52 }, { label: "Wed", value: 42 }, { label: "Thu", value: 72 }, { label: "Fri", value: 61 }];
const stats = [{ id: "one", label: "Active", value: "24" }, { id: "two", label: "Trend", value: "+18%", trend: "positive" as const }];

function ClarificationExample() {
  const [response, setResponse] = useState("");
  return <Question style={{ maxWidth: 640 }} className="hk-question-demo" onSubmit={value => setResponse(`Response submitted: ${value.selectedValues.join(", ") || value.text}`)}>
    <QuestionPrompt>What should happen next?</QuestionPrompt>
    <QuestionDescription>The workspace review is ready. Choose an option, then send your response.</QuestionDescription>
    <QuestionOptions><QuestionOption value="continue" aria-label="Continue"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7"/></svg><span>Continue with the recommended plan</span></QuestionOption><QuestionOption value="review"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4m0 4h.01"/><circle cx="12" cy="12" r="9"/></svg><span>Review the changes first</span></QuestionOption></QuestionOptions>
    <QuestionInput aria-label="Additional instructions" placeholder="Or add your own instructions…" />
    <QuestionActions><QuestionSubmit variant="primary">Send response <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></QuestionSubmit>{response && <output>{response}</output>}</QuestionActions>
  </Question>;
}

export function renderAiChatbot(component: string, state: ExampleState = "default"): ReactNode | undefined {
  if (component === "OpenIn" || component === "OpenInChat") return <OpenIn style={{ maxWidth: 304 }} query="Explain this result"><OpenInTrigger /><OpenInContent><OpenInLabel>Continue this conversation in</OpenInLabel><OpenInChatGPT /><OpenInClaude /></OpenInContent></OpenIn>;
  if (component === "OpenInChatGPT" || component === "OpenInClaude" || component === "OpenInContent") return <OpenIn query="Explain this result"><OpenInContent>{component === "OpenInChatGPT" ? <OpenInChatGPT /> : component === "OpenInClaude" ? <OpenInClaude /> : <OpenInContent>Host-provided destination content</OpenInContent>}</OpenInContent></OpenIn>;
  if (component === "Image") return <Image alt="Illustrative landscape, a local sample" src={sampleImage(0)} />;
  if (component === "ModelSelector") return <SelectorsExample component={component} state={state} />;
  if (component === "Question") return <ClarificationExample />;
  if (component === "Queue") return <QueueExample state={state} />;

  return undefined;
}
