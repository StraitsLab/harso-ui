// Lane-owned gallery fixtures (base). The router in catalogue-examples.tsx calls this first-match; return undefined to pass.
import type { ReactNode } from "react";
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

export function renderBase(component: string, state: ExampleState = "default"): ReactNode | undefined {
  if (component === "SocialButton") return <SocialButtonExample state={state} />;

  return undefined;
}
