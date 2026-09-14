// Router only (lead-owned): each lane owns its fixture file. Order matters for shared names; first match wins.
import type { ExampleState } from "./examples";
import { renderCharts } from "./catalogue-charts";
import { renderBlocks } from "./catalogue-blocks";
import { renderAiChatbot } from "./catalogue-ai-chatbot";
import { renderAiCode } from "./catalogue-ai-code";
import { renderWorkflowVoice } from "./catalogue-workflow-voice";
import { renderBase } from "./catalogue-base";


export const catalogueExports = ["Questionnaire", "ActivityRingsCard", "AgentLimitsCard", "AgentProgress", "AgentThinking", "AreaChartCard", "AudioPlayer", "AuthCard", "BarListCard", "Canvas", "Color", "ComboChartCard", "Connection", "Controls", "ContributionsCard", "EarningsChartCard", "Edge", "FinanceDashboard", "FunnelChartCard", "HeatmapChartCard", "HomeDashboard", "HrManagement", "Image", "JsxPreview", "LineChartCard", "MarketingDashboard", "MedicalProfile", "MicSelector", "ModelSelector", "MostActiveDaysCard", "Node", "Notification", "NotificationCenter", "OpenInChat", "OpenIn", "OpenInChatGPT", "OpenInClaude", "OpenInContent", "OrdersChartCard", "Panel", "Persona", "Question", "Queue", "RadarChartCard", "RadialChartCard", "RevenueChartCard", "Sandbox", "SchemaDisplay", "SettingsModal", "SleepScoreCard", "SocialButton", "SpeechInput", "StageBarsCard", "StepsCard", "TaskList", "Toolbar", "Transcription", "Typography", "VoiceSelector", "WebPreview", "WebSearch", "SankeyChartCard", "ScatterChartCard"] as const;
export type CatalogueExport = typeof catalogueExports[number] | string;


export function CatalogueExample({ component, state = "default" }: { component: string; state?: ExampleState }) {
  return <>{renderBlocks(component, state) ?? renderAiChatbot(component, state) ?? renderAiCode(component, state) ?? renderWorkflowVoice(component, state) ?? renderBase(component, state) ?? renderCharts(component, state)}</>;
}
