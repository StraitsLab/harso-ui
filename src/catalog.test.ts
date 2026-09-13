import { describe, expect, test } from "vitest";
import { filterReferences, referenceComponents, referenceSources, retiredReferenceIds, retiredReferences } from "./catalog";
import inventory from "./catalog.json";

describe("pinned reference inventory", () => {
  test("records Questionnaire as a supplemental public capture without invented part exports", () => {
    const source = inventory.sources.find(source => source.vendor === "boardui")!;
    expect(source.componentCount).toBe(77);
    expect(source.supplementalCapture?.identity).toBe("sha256:d4124b3e45006762ffc52c25674d7f1d14893ec6a9236230c2eb91ec467292bc");
    const family = referenceComponents.find(component => component.id === "boardui:questionnaire")!;
    expect(family.parts).toEqual([]);
    expect(family.helperApis).toEqual(["`QuestionnaireAnswers`"]);
    expect(filterReferences({ query: "QuestionnaireAnswers" }).map(component => component.id)).toEqual(["boardui:questionnaire"]);
  });
  test("maps each pinned vendor family individually without duplicate identities", () => {
    expect(new Set(referenceComponents.map(component => component.id)).size).toBe(referenceComponents.length);
    expect(referenceComponents.filter(component => component.vendor === "vercel")).toHaveLength(45);
    for (const source of referenceSources) {
      expect(referenceComponents.filter(component => component.vendor === source.vendor).length + retiredReferences.filter(component => component.vendor === source.vendor).length).toBe(source.componentCount);
      expect(source.retrievedAt).toMatch(/^2026-09-06/);
      expect(source.identity).not.toBe("");
    }
    for (const component of referenceComponents) {
      expect(component.id).toBe(`${component.vendor}:${component.slug}`);
      expect(component.url).toMatch(/^https:\/\/(www\.boardui\.com|elements\.ai-sdk\.dev|github\.com\/vercel\/ai-elements)\//);
      expect(component.name).not.toBe("");
      expect(component.harsoExport).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      expect(component.evidence).not.toBe("");
      expect(new Set(component.parts.map(part => part.name)).size).toBe(component.parts.length);
      expect(component.parts.every(part => part.name.trim() !== "" && /^[A-Z][A-Za-z0-9]*$/.test(part.harsoExport))).toBe(true);
    }
  });

  test("includes public documentation not yet in the website sitemap", () => {
    expect(referenceComponents.find(component => component.id === "vercel:question")?.url).toContain("github.com/vercel/ai-elements/blob/6a9d5b1822ffb10bba4bd97175f01edd7d8651cd/");
    const parts = referenceComponents.filter(component => component.vendor === "vercel").flatMap(component => component.parts);
    // Phase D removes 63 anatomy records; retained Vercel anatomy is exactly 328.
    expect(parts).toHaveLength(328);
    expect(parts.find(part => part.name === "AudioPlayerVolumeRange")).toBeTruthy();
    expect(parts.find(part => part.name === "ConfirmationAction")).toBeTruthy();
  });

  test("searches component and subcomponent names and combines filters", () => {
    expect(filterReferences({ query: "audioplayervolumerange" }).map(component => component.id)).toContain("vercel:audio-player");
    expect(filterReferences({ query: "PhoneNumberInput" }).map(component => component.id)).toContain("boardui:input");
    expect(filterReferences({ query: "MeetingScheduler" }).map(component => component.id)).toContain("boardui:date-picker");
    expect(filterReferences({ vendor: "vercel", query: "confirmation" }).every(component => component.vendor === "vercel")).toBe(true);
    expect(filterReferences({ query: "no-such-component-123" })).toHaveLength(0);
    expect(filterReferences({ query: "  " })).toHaveLength(referenceComponents.length);
  });

  test.each([
    ["file-tree", ["FileTreeIcon", "FileTreeName", "FileTreeActions"]],
    ["context", ["ContextInputUsage", "ContextOutputUsage", "ContextReasoningUsage", "ContextCacheUsage"]],
    ["schema-display", ["SchemaDisplayHeader", "SchemaDisplayMethod", "SchemaDisplayPath", "SchemaDisplayDescription", "SchemaDisplayContent", "SchemaDisplayParameters", "SchemaDisplayParameter", "SchemaDisplayRequest", "SchemaDisplayResponse", "SchemaDisplayProperty", "SchemaDisplayExample"]],
    ["open-in-chat", ["OpenInClaude", "OpenInT3", "OpenInScira", "OpenInv0", "OpenInCursor", "OpenInLabel", "OpenInSeparator"]],
    ["edge", ["Edge.Temporary", "Edge.Animated"]],
  ] as const)("discovers documented %s anatomy outside first-name headings", (slug, names) => {
    const family = referenceComponents.find(component => component.id === `vercel:${slug}`)!;
    for (const name of names) {
      expect(family.parts.find(part => part.name === name)).toBeTruthy();
      expect(filterReferences({ query: name, vendor: "vercel" }).map(component => component.id)).toContain(family.id);
    }
  });

  test("keeps documented types discoverable without presenting them as visual parts", () => {
    for (const [slug, names] of [["question", ["QuestionValue", "QuestionResponse"]]] as const) {
      const family = inventory.components.find(component => component.id === `vercel:${slug}`)!;
      for (const name of names) {
        expect(family.helperApis).toContain(`\`${name}\``);
        expect(family.parts.some(part => part.name === name)).toBe(false);
        expect(filterReferences({ query: name, vendor: "vercel" }).map(component => component.id)).toContain(family.id);
      }
    }
    const edge = inventory.components.find(component => component.id === "vercel:edge")!;
    expect(edge.helperApis).toEqual([]);
    expect(filterReferences({ query: "EdgeTemporary" }).map(component => component.id)).toContain(edge.id);
    expect(filterReferences({ query: "usePromptInputController" }).map(component => component.id)).toEqual([]);
  });

  test("counts UI anatomy separately from helpers and excludes foreign and demo names", () => {
    const parts = inventory.components.flatMap(component => component.parts);
    const helpers = inventory.components.flatMap(component => component.helperApis ?? []);
    expect(parts).toHaveLength(359);
    expect(helpers).toHaveLength(15);
    expect(inventory.accounting.apiPartCount).toBe(parts.length);
    expect(inventory.accounting.helperApiCount).toBe(helpers.length);
    expect(referenceComponents).toHaveLength(114);
    const names = [...parts.map(part => part.name), ...helpers.map(name => name.replaceAll("`", ""))];
    for (const name of ["SpeechRecognition", "SpeechRecognitionEvent", "SpeechRecognitionResult", "SpeechRecognitionAlternative", "SpeechRecognitionErrorEvent", "PromptInputAttachmentsDisplay", "useWebSearch", "CheckpointType", "CheckpointDemo", "getThinkingMessage", "Temporary", "Animated", "EdgeProps", "FileIcon", "ToolUIPart", "useChat"]) expect(names).not.toContain(name);
  });
  test("retires the exact Phase D reference set without hiding Shimmer", () => {
    expect([...retiredReferenceIds].sort()).toEqual(["boardui:ai-chat", "boardui:ai-image-generation", "boardui:ai-profile", "boardui:chat-starter", "boardui:composer", "boardui:composer-attachments", "boardui:composer-loader", "boardui:composer-panel", "vercel:conversation", "vercel:message", "vercel:prompt-input", "vercel:suggestion"]);
    expect(referenceComponents.some(component => retiredReferenceIds.includes(component.id))).toBe(false);
    expect(referenceComponents.find(component => component.id === "vercel:shimmer")).toBeTruthy();
  });
});
