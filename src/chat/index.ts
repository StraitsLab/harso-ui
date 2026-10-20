export { HarsoThread, type HarsoThreadProps } from "./thread";
export { HarsoUserMessage, HarsoAssistantMessage, HarsoEditComposer, type HarsoMessageSlots } from "./message";
export { HarsoMessageActions, type HarsoMessageActionCapabilities } from "./message-actions";

// Lane 2: composer
export { HarsoComposer, type HarsoComposerProps } from "./composer";
export { HarsoComposerAttachment, HarsoMessageAttachment } from "./attachments";

// Lane 3: parts
export { HarsoToolCall, HarsoToolState, HarsoTerminalTool, HarsoReadFileTool, harsoToolComponents, type HarsoToolCallProps, type HarsoToolStateName } from "./tool-call";
export { HarsoApproval, type HarsoApprovalProps } from "./approval";
export { HarsoReasoning } from "./reasoning";
export { HarsoMessageError, HarsoStoppedRun } from "./error";

// Lane 4: shell
export { HarsoThreadList, HarsoSidebarNav, type HarsoThreadListProps, type HarsoThreadGroup, type HarsoSidebarNavItem, type HarsoSidebarNavProps } from "./thread-list";
export { HarsoChatShell, type HarsoChatShellProps } from "./shell";

// Lane 5: markdown
export { HarsoMarkdownText } from "./markdown";
export { HarsoCodeBlock, type HarsoCodeBlockProps } from "./code-block";
export { HarsoArtifact, type HarsoArtifactProps, type HarsoArtifactMode } from "./artifact";
export { HarsoWorkResult, type HarsoWorkResultProps, type HarsoWorkStatus, type HarsoWorkStep, type HarsoWorkStepState, type HarsoWorkArtifact } from "./work-result";

export { HarsoOutputDetail, type HarsoOutputDetailProps, type HarsoOutputAction, type HarsoOutputPreviewState } from "./output-detail";
export { HarsoOutputCard, HarsoOutputCardPlaceholder, type HarsoOutputFormBlock, type HarsoOutputFormField, HarsoOutputActionRow, HarsoOutputCardMeta, HARSO_OUTPUT_CARD_CAPS, HARSO_OUTPUT_CARD_UNCAPPED, harsoOutputWholeAnswer, harsoOutputDocumentPlainText, type HarsoOutputCardProps, type HarsoOutputCardCaps, type HarsoOutputDocument, type HarsoOutputDocumentDetails, type HarsoOutputHeader, type HarsoOutputBlock, type HarsoOutputRowsBlock, type HarsoOutputRow, type HarsoOutputNumbersBlock, type HarsoOutputNumber, type HarsoOutputTextBlock, type HarsoOutputTextSection, type HarsoOutputActionBlock, type HarsoOutputActionSpec, type HarsoOutputActionHost, type HarsoOutputWorkControl, type HarsoOutputRoutineControl, type HarsoOutputPageWatchControl, type HarsoOutputOtherBlock, type HarsoOutputSource } from "./output-card";
export { harsoOutputBlockPlainText, type HarsoOutputBlockState, type HarsoOutputChart, type HarsoOutputSeries, type HarsoOutputVisualBlock, type HarsoOutputTableBlock, type HarsoOutputTableColumn, type HarsoOutputTableRow } from "./output-card-charts";
export { mediaPlainText as harsoOutputMediaPlainText, type HarsoOutputMediaHost, type HarsoOutputGoogleMaps, type HarsoOutputStatusBlock, type HarsoOutputSubjectStatusBlock, type HarsoOutputTrackingStatusBlock, type HarsoOutputStatusState, type HarsoOutputStatusSubject, type HarsoOutputSubjectState, type HarsoOutputMeaning, type HarsoOutputMap, type HarsoOutputPlace, type HarsoOutputImage, type HarsoOutputPhoto, type HarsoOutputVideo, type HarsoOutputMedia } from "./output-card-media";

// WEV-3303: the v6 card-family foundation. Aliased with the Harso prefix because src/index.ts re-exports this file whole.
export { V6Frame as HarsoV6Frame, V6Brand as HarsoV6Brand, isBrandDomain as harsoV6IsBrandDomain, type V6FrameProps as HarsoV6FrameProps } from "./v6/frame";
export { V6_FAMILIES as HARSO_V6_FAMILIES, harsoV6WidgetSizes, v6TemplateOf as harsoV6TemplateOf } from "./v6/registry";
export { V6_TEMPLATES as HARSO_V6_TEMPLATES, type V6Template as HarsoV6Template, type V6Mode as HarsoV6Mode, type WidgetSize as HarsoWidgetSize, type V6Host as HarsoV6Host,
  type V6FamilyProps as HarsoV6FamilyProps, type V6Family as HarsoV6Family, type V6Registry as HarsoV6Registry, type V6RenderBrand as HarsoV6RenderBrand, type V6BrandRequest as HarsoV6BrandRequest,
  type V6RowFields as HarsoV6RowFields, type V6RowAction as HarsoV6RowAction, type V6Flight as HarsoV6Flight, type V6Weather as HarsoV6Weather, type V6HourlyWeather as HarsoV6HourlyWeather,
  type V6DailyWeather as HarsoV6DailyWeather, type V6Sky as HarsoV6Sky, type V6WeatherCondition as HarsoV6WeatherCondition, type V6ChartRange as HarsoV6ChartRange,
  type V6TrackingCondition as HarsoV6TrackingCondition, type V6OpenState as HarsoV6OpenState, type V6TravelMode as HarsoV6TravelMode, type V6CalendarColor as HarsoV6CalendarColor } from "./v6/types";

// Lane 6: runtime
export { HARSO_STREAM_VERSION, type HarsoEvent, type HarsoTransport } from "./runtime/stream-types";
export { initialHarsoState, reduceHarsoEvent, mapHistory, type HarsoStreamState, type HarsoViewTurn } from "./runtime/convert";
export { createHarsoAdapter, useHarsoRuntime, createScriptedTransport, type HarsoAdapter, type HarsoRuntimeOptions } from "./runtime/harso-runtime";
