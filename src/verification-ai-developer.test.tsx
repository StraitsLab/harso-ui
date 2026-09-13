import { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Artifact, ArtifactAction, ArtifactActions, ArtifactContent, ArtifactDescription, ArtifactHeader, ArtifactTitle, Source, Sources, SourcesContent, SourcesTrigger, Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from "./activity";
import { Attachment, AttachmentEmpty, AttachmentPreview, AttachmentRemove, Attachments, type AttachmentData } from "./attachments";
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtImage, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults, ChainOfThoughtStep } from "./chain-of-thought";
import { CodeBlock, CodeBlockContent } from "./code-block";
import { MessageResponse } from "./index";
import { IconButton } from "./primitives";
import { AssistantRuntimeProvider, useLocalRuntime, useAuiState, type ThreadMessage } from "@assistant-ui/react";
import { HarsoComposer } from "./chat/composer";
import { attachments } from "./chat/testing/scripted-adapter";
import { Context, ContextCacheUsage, ContextContent, ContextContentBody, ContextContentHeader, ContextInputUsage, ContextOutputUsage, ContextReasoningUsage, type ContextProps } from "./context";
import { InlineCitationCarousel, InlineCitationCarouselContent, InlineCitationCarouselHeader, InlineCitationCarouselIndex, InlineCitationCarouselItem, InlineCitationCarouselNext, InlineCitationCarouselPrev } from "./inline-citation";
import { AttachmentHoverCard, AttachmentHoverCardContent, AttachmentHoverCardTrigger } from "./attachments";
import { Queue, QueueItem, QueueItemAction, QueueItemContent, QueueItemDescription, QueueItemFile, QueueItemIndicator, QueueList, QueueSection, QueueSectionContent, QueueSectionLabel, QueueSectionTrigger, type QueueMessage, type QueueMessagePart, type QueueTodo } from "./queue";
import { SchemaDisplayParameter, SchemaDisplayParameters, SchemaDisplayProperty, type SchemaParameter, type SchemaProperty } from "./schema-display";
import { Plan, PlanAction, PlanContent, PlanDescription, PlanHeader, PlanTitle, PlanTrigger } from "./work";

afterEach(() => vi.restoreAllMocks());

describe("WEV-1492 supported AI and developer compositions", () => {
  it("artifact code composition preserves header semantics, inert source and explicit grouped actions", async () => {
    const selected = vi.fn();
    const submitted = vi.fn();
    const fixture = (code: string, disabled = false) => <form onSubmit={submitted}><Artifact>
      <ArtifactHeader data-testid="artifact-header"><ArtifactTitle>Review generated code</ArtifactTitle><ArtifactDescription>Host supplied, not executed</ArtifactDescription><ArtifactActions><ArtifactAction label="Use code" onClick={() => selected(code)} disabled={disabled} /></ArtifactActions></ArtifactHeader>
      <ArtifactContent><CodeBlock code={code}><CodeBlockContent /></CodeBlock></ArtifactContent>
    </Artifact></form>;
    const source = '<script>throw new Error("never execute")</script>\r\n';
    const view = render(fixture(source));
    const header = screen.getByTestId("artifact-header");
    expect(within(header).getByRole("heading", { level: 3, name: "Review generated code" })).toBeVisible();
    expect(within(header).getByText("Host supplied, not executed").tagName).toBe("P");
    const actions = within(header).getByRole("group", { name: "Artifact actions" });
    expect(screen.getAllByRole("code")).toHaveLength(1);
    expect(screen.getByRole("code").textContent).toBe(source);
    expect(view.container.querySelector("script,iframe,img")).toBeNull();
    expect(selected).not.toHaveBeenCalled();
    await userEvent.click(within(actions).getByRole("button", { name: "Use code" }));
    expect(selected).toHaveBeenCalledExactlyOnceWith(source);
    expect(submitted).not.toHaveBeenCalled();
    view.rerender(fixture("const replacement = 2;", true));
    expect(screen.getByRole("code").textContent).toBe("const replacement = 2;");
    expect(screen.queryByText(/never execute/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Use code" }));
    expect(selected).toHaveBeenCalledTimes(1);
    view.rerender(fixture(""));
    expect(screen.getByRole("code").textContent).toBe("");
  });

  it("host suggestions update the one runtime draft only when accepted", async () => {
    const submitted = vi.fn(); const requested = vi.fn();
    function Draft({ hold = false }: { hold?: boolean }) {
      const runtime = useLocalRuntime({ async *run({ messages }) { submitted(messages.at(-1)?.content); yield { content: [{ type: "text", text: "Done" }] }; } });
      return <AssistantRuntimeProvider runtime={runtime}><button onClick={() => { requested("Compare the trade-offs"); if (!hold) runtime.thread.composer.setText("Compare the trade-offs"); }}>Compare the trade-offs</button><button disabled>Unavailable suggestion</button><HarsoComposer /></AssistantRuntimeProvider>;
    }
    const view = render(<Draft hold />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Original draft" } });
    await userEvent.click(screen.getByRole("button", { name: "Compare the trade-offs" }));
    expect(requested).toHaveBeenCalledExactlyOnceWith("Compare the trade-offs");
    expect(screen.getByRole("textbox")).toHaveValue("Original draft");
    expect(submitted).not.toHaveBeenCalled();
    view.rerender(<Draft />);
    await userEvent.click(screen.getByRole("button", { name: "Compare the trade-offs" }));
    await userEvent.click(screen.getByRole("button", { name: "Unavailable suggestion" }));
    expect(screen.getByRole("textbox")).toHaveValue("Compare the trade-offs");
    expect(submitted).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submitted).toHaveBeenCalledExactlyOnceWith([{ type: "text", text: "Compare the trade-offs" }]);
  });

  it("runtime attachment views share files and remove once without stale submission", async () => {
    const remove = vi.fn(attachments.remove); const submitted = vi.fn();
    let runtime: ReturnType<typeof useLocalRuntime>;
    function Files() {
      const files = useAuiState(state => state.composer.attachments);
      return <output aria-label="Provider files">{files.map(file => file.name).join(", ")}</output>;
    }
    function Host() {
      runtime = useLocalRuntime({ async *run({ messages }) { submitted(messages.at(-1)); yield { content: [{ type: "text", text: "Done" }] }; } }, { adapters: { attachments: { ...attachments, remove } } });
      return <AssistantRuntimeProvider runtime={runtime}><Files /><HarsoComposer /></AssistantRuntimeProvider>;
    }
    render(<Host />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await act(async () => { await runtime!.thread.composer.addAttachment(new File(["brief"], "brief.txt")); await runtime!.thread.composer.addAttachment(new File(["notes"], "notes.txt")); });
    expect(screen.getByLabelText("Provider files")).toHaveTextContent("brief.txt, notes.txt");
    expect(screen.getByText("brief.txt")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Remove brief.txt" }));
    expect(remove).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Provider files")).toHaveTextContent(/^notes.txt$/);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submitted).toHaveBeenCalledWith(expect.objectContaining({ attachments: [expect.objectContaining({ name: "notes.txt" })] }));
    // Accepted runtime sends consume attachments; data URLs need no legacy object-URL revocation.
    expect(screen.getByLabelText("Provider files")).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("host referenced sources replace duplicate IDs and remove and clear consumer state", async () => {
    function SourcesHost() {
      const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
      return <><button onClick={() => setSources([{ id: "first", name: "Old title" }])}>Add source</button><button onClick={() => setSources([{ id: "first", name: "Updated title" }, { id: "second", name: "Another source" }])}>Replace and add</button><button onClick={() => setSources(value => value.filter(source => source.id !== "first"))}>Remove first</button><button onClick={() => setSources([])}>Clear sources</button><ul aria-label="Referenced sources">{sources.map(source => <li key={source.id}>{source.name}</li>)}</ul></>;
    }
    render(<SourcesHost />);
    const list = screen.getByRole("list", { name: "Referenced sources" });
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Add source" }));
    await userEvent.click(screen.getByRole("button", { name: "Replace and add" }));
    expect(within(list).getAllByRole("listitem").map(item => item.textContent)).toEqual(["Updated title", "Another source"]);
    expect(screen.queryByText("Old title")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Remove first" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove first" }));
    expect(within(list).getAllByRole("listitem").map(item => item.textContent)).toEqual(["Another source"]);
    await userEvent.click(screen.getByRole("button", { name: "Clear sources" }));
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("SchemaParameter consumers preserve locations, requiredness and optional-field removal", () => {
    expectTypeOf<{ name: string; type: string; location: "cookie" }>().not.toExtend<SchemaParameter>();
    const parameters: SchemaParameter[] = [
      { name: "workspace", type: "string", location: "path", required: true, description: "Explicit workspace" },
      { name: "filter", type: "string", location: "query" },
      { name: "revision", type: "integer", location: "header" },
      { name: "limit", type: "integer" }
    ];
    const view = render(<SchemaDisplayParameters open parameters={parameters} />);
    expect(screen.getByText("Explicit workspace")).toBeVisible();
    expect(screen.getAllByLabelText("Required")).toHaveLength(1);
    for (const label of ["string · path", "string · query", "integer · header", "integer · query"]) expect(screen.getByText(label)).toBeVisible();
    const replacement: SchemaParameter = { name: "workspace", type: "string" };
    view.rerender(<SchemaDisplayParameter parameter={replacement} />);
    expect(screen.queryByLabelText("Required")).toBeNull();
    expect(screen.queryByText("Explicit workspace")).toBeNull();
    expect(screen.getByText("string · query")).toBeVisible();
  });

  it("SchemaProperty consumer traverses object and array children and retires replaced schema fields", () => {
    expectTypeOf<{ name: string; type: string; items: string }>().not.toExtend<SchemaProperty>();
    const property: SchemaProperty = { name: "events", type: "array", required: true, description: "Ordered events", items: { name: "event", type: "object", properties: [{ name: "identifier", type: "string", required: true, description: "<script>not executed</script>" }, { name: "optionalLabel", type: "string" }] } };
    const view = render(<SchemaDisplayProperty schemaProperty={property} />);
    for (const name of ["events", "event", "identifier", "optionalLabel", "Ordered events", "<script>not executed</script>"]) expect(screen.getByText(name)).toBeVisible();
    expect(screen.getAllByLabelText("Required")).toHaveLength(2);
    expect(view.container.querySelector("script")).toBeNull();
    const replacement: SchemaProperty = { name: "events", type: "string" };
    view.rerender(<SchemaDisplayProperty schemaProperty={replacement} />);
    expect(screen.getByText("events")).toBeVisible();
    for (const name of ["event", "identifier", "optionalLabel", "Ordered events"]) expect(screen.queryByText(name)).toBeNull();
    expect(screen.queryByLabelText("Required")).toBeNull();
  });

  it("ToolPart consumer preserves static and dynamic names and replaces success with an inert error", () => {
    expectTypeOf<{ type: "dynamic-tool"; state: "input-streaming" }>().not.toExtend<ToolPart>();
    expectTypeOf<{ type: "tool-search"; state: "invented" }>().not.toExtend<ToolPart>();
    function Part({ part }: { part: ToolPart }) {
      const { input, output, errorText, ...header } = part;
      return <Tool defaultOpen><ToolHeader {...header} /><ToolContent><ToolInput input={input} /><ToolOutput output={output} errorText={errorText} /></ToolContent></Tool>;
    }
    const initial: ToolPart = { type: "tool-search", state: "input-streaming", input: { query: "research" } };
    const view = render(<Part part={initial} />);
    expect(screen.getByRole("button", { name: "search Pending" })).toBeVisible();
    expect(screen.getByRole("code").textContent).toBe('{\n  "query": "research"\n}');
    const success: ToolPart = { type: "dynamic-tool", toolName: "Find evidence", state: "output-available", output: <button>Inspect result</button> };
    view.rerender(<Part part={success} />);
    expect(screen.getByRole("button", { name: "Find evidence Completed" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Inspect result" })).toBeVisible();
    view.rerender(<Part part={{ ...success, state: "output-error", errorText: "<script>failure</script>" }} />);
    expect(screen.getByRole("button", { name: "Find evidence Error" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Inspect result" })).toBeNull();
    expect(screen.getByText("<script>failure</script>")).toBeVisible();
    expect(view.container.querySelector("script")).toBeNull();
  });

  it("typed queue messages and todos compose with the runtime composer without adding work before explicit submission", async () => {
    expectTypeOf<{ id: string; parts: string }>().not.toExtend<QueueMessage>();
    expectTypeOf<{ text: string }>().not.toExtend<QueueMessagePart>();
    expectTypeOf<{ id: string; title: string; status: "running" }>().not.toExtend<QueueTodo>();
    const file: QueueMessagePart = { type: "file", url: "data:text/plain,brief", filename: "<script>brief.txt", mediaType: "text/plain" };
    const initial: QueueMessage = { id: "draft-1", parts: [{ type: "text", text: "Review brief" }, file] };
    const todo: QueueTodo = { id: "todo-1", title: "Check evidence", description: "Use supplied sources", status: "pending" };
    function QueuedDraft() {
      const [messages, setMessages] = useState<QueueMessage[]>([initial]);
      const [task, setTask] = useState<QueueTodo>(todo);
      const runtime = useLocalRuntime({ async *run({ messages: turns }) {
        const text = turns.at(-1)!.content.filter(part => part.type === "text").map(part => part.text).join("");
        setMessages(previous => [...previous, { id: `draft-${previous.length + 1}`, parts: [{ type: "text", text }] }]);
        yield { content: [{ type: "text", text: "Queued" }] };
      } });
      const completed = task.status === "completed";
      return <><Queue><QueueSection><QueueSectionTrigger><QueueSectionLabel label="Queued messages" count={messages.length} /></QueueSectionTrigger><QueueSectionContent><QueueList aria-label="Queued messages">{messages.map(message => <QueueItem key={message.id}>{message.parts.map((part, index) => part.type === "text" ? <QueueItemContent key={index}>{part.text}</QueueItemContent> : <QueueItemFile key={index} name={part.filename} />)}</QueueItem>)}</QueueList></QueueSectionContent></QueueSection><QueueList aria-label="Queued todos"><QueueItem><QueueItemIndicator completed={completed} /><QueueItemContent completed={completed}>{task.title}</QueueItemContent><QueueItemDescription completed={completed}>{task.description}</QueueItemDescription><QueueItemAction disabled={completed} onClick={() => setTask({ ...task, status: "completed" })}>Complete task</QueueItemAction></QueueItem></QueueList></Queue><AssistantRuntimeProvider runtime={runtime}><HarsoComposer aria-label="Queued draft" /></AssistantRuntimeProvider></>;
    }
    const view = render(<QueuedDraft />);
    const messages = screen.getByRole("list", { name: "Queued messages" });
    const todos = screen.getByRole("list", { name: "Queued todos" });
    expect(within(messages).getAllByRole("listitem")).toHaveLength(1);
    expect(within(messages).getByText("Review brief")).toBeVisible();
    expect(within(messages).getByText("<script>brief.txt")).toBeVisible();
    expect(view.container.querySelector("script,img,iframe")).toBeNull();
    const summary = screen.getByText("Queued messages", { selector: "span" });
    expect(summary).toHaveTextContent("1Queued messages");
    expect(within(todos).getByLabelText("Pending")).toBeVisible();
    expect(within(todos).getByText("Check evidence")).not.toHaveClass("hk-queue-item-content--completed");
    expect(within(todos).getByText("Use supplied sources")).not.toHaveClass("hk-queue-item-description--completed");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Follow up" } });
    expect(within(messages).getAllByRole("listitem")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(within(messages).getAllByRole("listitem")).toHaveLength(2);
    expect(within(messages).getByText("Follow up")).toBeVisible();
    expect(summary).toHaveTextContent("2Queued messages");
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Complete task" }));
    expect(within(todos).queryByLabelText("Pending")).toBeNull();
    expect(within(todos).getByLabelText("Completed")).toBeVisible();
    expect(within(todos).getByText("Check evidence")).toHaveClass("hk-queue-item-content--completed");
    expect(within(todos).getByText("Use supplied sources")).toHaveClass("hk-queue-item-description--completed");
    expect(screen.getByRole("button", { name: "Complete task" })).toBeDisabled();
    expect(within(messages).getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("WEV-1492 second AI and developer evidence slice", () => {
  it("plan header parts follow supplied streaming state while header decisions remain outside collapsed details", async () => {
    const decision = vi.fn();
    const fixture = (streaming: boolean, disabled = false) => <Plan isStreaming={streaming}><PlanHeader data-testid="plan-header"><PlanTitle>Review the proposed steps</PlanTitle><PlanDescription>Three host-supplied steps</PlanDescription><PlanAction><button type="button" disabled={disabled} onClick={decision}>Review plan</button></PlanAction><PlanTrigger /></PlanHeader><PlanContent><input aria-label="Plan decision notes" defaultValue="Retain this" /></PlanContent></Plan>;
    const view = render(fixture(true));
    const header = screen.getByTestId("plan-header");
    const title = within(header).getByRole("heading", { level: 3, name: "Review the proposed steps" });
    const description = within(header).getByText("Three host-supplied steps");
    expect(description.closest("p")).not.toBeNull();
    expect(title.querySelector("[data-active]")).not.toBeNull();
    expect(description).toHaveAttribute("data-active");
    expect(screen.queryByRole("textbox")).toBeNull();
    await userEvent.click(within(header).getByRole("button", { name: "Review plan" }));
    expect(decision).toHaveBeenCalledOnce();
    expect(within(header).getByRole("button", { name: "Plan details" })).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(within(header).getByRole("button", { name: "Plan details" }));
    expect(screen.getByRole("textbox")).toHaveValue("Retain this");
    view.rerender(fixture(false, true));
    expect(title.querySelector("[data-active]")).toBeNull();
    expect(description).not.toHaveAttribute("data-active");
    expect(screen.getByRole("textbox")).toHaveValue("Retain this");
    expect(within(header).getByRole("button", { name: "Plan details" })).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(within(header).getByRole("button", { name: "Plan details" }));
    expect(title).toBeVisible();
    expect(description).toBeVisible();
    const action = within(header).getByRole("button", { name: "Review plan" });
    expect(action).toBeVisible();
    expect(action).toBeDisabled();
    await userEvent.click(action);
    expect(decision).toHaveBeenCalledOnce();
  });

  it("message content and toolbar compose independent actions that retain their own state across response updates", async () => {
    const submitted = vi.fn();
    function Response({ text, disabled = false }: { text: string; disabled?: boolean }) {
      const [helpful, setHelpful] = useState(false);
      return <form onSubmit={submitted}><article aria-label="Harso"><div data-testid="message-content"><MessageResponse>{text}</MessageResponse></div><div data-testid="message-toolbar"><div role="group" aria-label="Message actions"><IconButton type="button" label="Helpful" aria-pressed={helpful} disabled={disabled} onClick={() => setHelpful(value => !value)}>Like</IconButton></div><output aria-label="Feedback">{helpful ? "Marked helpful" : "No feedback"}</output></div></article></form>;
    }
    const view = render(<Response text="**Initial response**" />);
    const content = screen.getByTestId("message-content");
    const toolbar = screen.getByTestId("message-toolbar");
    expect(within(content).getByText("Initial response").tagName).toBe("STRONG");
    const actions = within(toolbar).getByRole("group", { name: "Message actions" });
    const button = within(actions).getByRole("button", { name: "Helpful" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(within(toolbar).getByLabelText("Feedback")).toHaveTextContent("Marked helpful");
    expect(submitted).not.toHaveBeenCalled();
    view.rerender(<Response text="Replacement response" disabled />);
    expect(within(content).queryByText("Initial response")).toBeNull();
    expect(within(content).getByText("Replacement response")).toBeVisible();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(within(toolbar).getByLabelText("Feedback")).toHaveTextContent("Marked helpful");
    expect(within(content).queryByRole("button")).toBeNull();
  });

  it("usage components read distinct token fields and retire values when host usage becomes unavailable", () => {
    const fixture = (usage: ContextProps["usage"], open = true, usedTokens = 250, maxTokens = 1000) => <Context usedTokens={usedTokens} maxTokens={maxTokens} usage={usage} open={open}><ContextContent><ContextContentHeader data-testid="usage-header" /><ContextContentBody data-testid="usage-body"><ContextInputUsage data-testid="input-usage" /><ContextOutputUsage data-testid="output-usage" /><ContextReasoningUsage data-testid="reasoning-usage" /><ContextCacheUsage data-testid="cache-usage" /></ContextContentBody></ContextContent></Context>;
    const usage = { inputTokens: 100, outputTokens: 200, reasoningTokens: 50, cachedInputTokens: 0 };
    const view = render(fixture(usage));
    const header = screen.getByTestId("usage-header");
    const body = screen.getByTestId("usage-body");
    expect(within(header).getByText("25% used")).toBeVisible();
    expect(within(header).getByText("250 / 1.0K tokens")).toBeVisible();
    expect(header.querySelector(".hk-context-bar > span")).toHaveStyle({ width: "25%" });
    for (const [name, label, value] of [["input", "Input", "100"], ["output", "Output", "200"], ["reasoning", "Reasoning", "50"], ["cache", "Cached", "0"]]) {
      const row = within(body).getByTestId(`${name}-usage`);
      expect(within(row).getByText(label)).toBeVisible();
      expect(within(row).getByText(value)).toBeVisible();
    }
    view.rerender(fixture(usage, false));
    expect(body).not.toBeVisible();
    expect(header).not.toBeVisible();
    view.rerender(fixture(undefined, true, NaN, 0));
    expect(body).toBeVisible();
    expect(within(header).getByText("Context usage unavailable")).toBeVisible();
    expect(within(header).getByText("Unavailable / 0 tokens")).toBeVisible();
    expect(header.querySelector(".hk-context-bar > span")).toHaveStyle({ width: "0%" });
    for (const name of ["input", "output", "reasoning", "cache"]) expect(within(screen.getByTestId(`${name}-usage`)).getByText("Unavailable")).toBeVisible();
    expect(screen.queryByText("200")).toBeNull();
  });

  it("usage components honor zero overrides, invalid costs and custom content without leaking provider values", () => {
    const view = render(<Context usedTokens={10} maxTokens={100} usage={{ outputTokens: 999, reasoningTokens: 888, cachedInputTokens: 777 }}><ContextOutputUsage data-testid="output" label="Completion" value={0} cost={0} /><ContextReasoningUsage data-testid="reasoning" value={-1} cost={NaN} /><ContextCacheUsage data-testid="cache" value={1000000} cost={1.25} /></Context>);
    expect(screen.getByTestId("output")).toHaveTextContent("Completion0 · $0.0000");
    expect(screen.getByTestId("reasoning")).toHaveTextContent("ReasoningUnavailable · Cost unavailable");
    expect(screen.getByTestId("cache")).toHaveTextContent("Cached1.0M · $1.2500");
    for (const value of ["999", "888", "777"]) expect(screen.queryByText(value)).toBeNull();
    view.rerender(<Context usedTokens={1} maxTokens={2}><ContextOutputUsage label="Custom usage" value={999}><strong>Reported by host</strong></ContextOutputUsage></Context>);
    expect(screen.getByText("Custom usage")).toBeVisible();
    expect(screen.getByText("Reported by host").tagName).toBe("STRONG");
    expect(screen.queryByText("999")).toBeNull();
  });

  it("AttachmentPreview replaces image, video and audio semantics and falls back only when media is absent", () => {
    const fixture = (data: AttachmentData) => <Attachments><Attachment data={data}><AttachmentPreview fallbackIcon="No media supplied" /></Attachment></Attachments>;
    const view = render(fixture({ id: "media", name: "Sketch", mediaType: "image/png", url: "data:image/png;base64,aGVsbG8=" }));
    expect(screen.getByRole("img", { name: "Sketch" })).toHaveAttribute("src", "data:image/png;base64,aGVsbG8=");
    for (const category of ["video", "audio"] as const) {
      view.rerender(fixture({ id: "media", name: `${category} reference`, mediaType: `${category}/test`, url: `blob:local-${category}` }));
      expect(screen.queryByRole("img")).toBeNull();
      const media = screen.getByLabelText(`${category} reference`, { selector: category });
      expect(media).toHaveAttribute("src", `blob:local-${category}`);
      expect(media).toHaveAttribute("controls");
      expect(media).not.toHaveAttribute("autoplay");
      expect(view.container.querySelectorAll("img,video,audio")).toHaveLength(1);
    }
    view.rerender(fixture({ id: "media", mediaType: "image/png" }));
    expect(view.container.querySelector("img,video,audio")).toBeNull();
    expect(screen.getByText("No media supplied")).toHaveAttribute("aria-hidden", "true");
    view.rerender(fixture({ id: "file", mediaType: "application/pdf", url: "blob:local-document" }));
    expect(view.container.querySelector("img,video,audio,iframe,object")).toBeNull();
    expect(screen.getByText("No media supplied")).toBeVisible();
  });

  it("AttachmentEmpty participates in an actual add and remove consumer with custom empty action", async () => {
    function Files({ custom = false }: { custom?: boolean }) {
      const [present, setPresent] = useState(false);
      return <Attachments>{present ? <Attachment data={{ id: "brief", name: "Brief" }} onRemove={() => setPresent(false)}><AttachmentRemove /></Attachment> : <AttachmentEmpty>{custom ? <button onClick={() => setPresent(true)}>Choose a local file</button> : undefined}</AttachmentEmpty>}</Attachments>;
    }
    const view = render(<Files />);
    expect(screen.getByText("No attachments")).toBeVisible();
    view.rerender(<Files custom />);
    expect(screen.queryByText("No attachments")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Choose a local file" }));
    expect(screen.queryByRole("button", { name: "Choose a local file" })).toBeNull();
    expect(screen.getByLabelText("Brief")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByLabelText("Brief")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a local file" })).toBeVisible();
  });

  it("chain search-result parts and reference image stay inside disclosure and replace image with supplied fallback", async () => {
    const fixture = (src?: string) => <ChainOfThought><ChainOfThoughtHeader /><ChainOfThoughtContent><ChainOfThoughtStep label="Evidence"><ChainOfThoughtSearchResults data-testid="chain-results"><ChainOfThoughtSearchResult>First source</ChainOfThoughtSearchResult><ChainOfThoughtSearchResult>Second source</ChainOfThoughtSearchResult></ChainOfThoughtSearchResults><ChainOfThoughtImage src={src} caption="Reference sketch"><span>Reference not supplied</span></ChainOfThoughtImage></ChainOfThoughtStep></ChainOfThoughtContent></ChainOfThought>;
    const view = render(fixture("data:image/png;base64,aGVsbG8="));
    expect(screen.getByTestId("chain-results")).not.toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Chain of Thought" }));
    const results = screen.getByTestId("chain-results");
    expect(within(results).getByText("First source")).toBeVisible();
    expect(within(results).getByText("Second source")).toBeVisible();
    const image = screen.getByRole("img", { name: "Reference sketch" });
    expect(image).toHaveAttribute("src", "data:image/png;base64,aGVsbG8=");
    expect(image.parentElement?.tagName).toBe("FIGURE");
    expect(screen.getByText("Reference sketch").tagName).toBe("FIGCAPTION");
    expect(screen.queryByText("Reference not supplied")).toBeNull();
    view.rerender(fixture());
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Reference not supplied")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Chain of Thought" }));
    expect(results).not.toBeVisible();
    expect(screen.getByText("Reference not supplied")).not.toBeVisible();
  });

  it("citation header and previous control navigate actual items with cancellation and empty boundaries", async () => {
    const fixture = (items: string[], prevent = false, disabled = false) => <InlineCitationCarousel><InlineCitationCarouselHeader data-testid="citation-header"><InlineCitationCarouselPrev disabled={disabled} onClick={event => { if (prevent) event.preventDefault(); }} /><InlineCitationCarouselIndex /><InlineCitationCarouselNext /></InlineCitationCarouselHeader><InlineCitationCarouselContent>{items.map(item => <InlineCitationCarouselItem key={item}>{item}</InlineCitationCarouselItem>)}</InlineCitationCarouselContent></InlineCitationCarousel>;
    const view = render(fixture(["First evidence", "Second evidence"]));
    const header = screen.getByTestId("citation-header");
    const previous = within(header).getByRole("button", { name: "Previous citation" });
    expect(previous).toBeDisabled();
    expect(within(header).getByText("1/2")).toHaveAttribute("aria-live", "polite");
    await userEvent.click(within(header).getByRole("button", { name: "Next citation" }));
    expect(screen.getByText("First evidence")).not.toBeVisible();
    expect(screen.getByText("Second evidence")).toBeVisible();
    view.rerender(fixture(["First evidence", "Second evidence"], true));
    await userEvent.click(previous);
    expect(within(header).getByText("2/2")).toBeVisible();
    view.rerender(fixture(["First evidence", "Second evidence"], false, true));
    expect(previous).toBeDisabled();
    view.rerender(fixture(["First evidence", "Second evidence"]));
    await userEvent.click(previous);
    expect(within(header).getByText("1/2")).toBeVisible();
    expect(screen.getByText("First evidence")).toBeVisible();
    expect(screen.getByText("Second evidence")).not.toBeVisible();
    view.rerender(fixture([]));
    expect(within(header).getByText("0/0")).toBeVisible();
    expect(previous).toBeDisabled();
    expect(within(header).getByRole("button", { name: "Next citation" })).toBeDisabled();
  });

  it("shared attachment hover-card parts share delayed disclosure, preserve interior focus and honor host refusal", () => {
    vi.useFakeTimers();
    try {
      const changed = vi.fn();
      const fixture = (open?: boolean) => <AttachmentHoverCard data-testid="prompt-hover" open={open} onOpenChange={changed} openDelay={100} closeDelay={50}><AttachmentHoverCardTrigger>Preview context</AttachmentHoverCardTrigger><AttachmentHoverCardContent align="end"><button>Inspect context</button></AttachmentHoverCardContent></AttachmentHoverCard>;
      const view = render(fixture());
      const root = screen.getByTestId("prompt-hover");
      const trigger = screen.getByRole("button", { name: "Preview context" });
      const content = document.getElementById(trigger.getAttribute("aria-controls")!);
      expect(content).not.toBeVisible();
      fireEvent.pointerEnter(root);
      act(() => vi.advanceTimersByTime(99));
      expect(content).not.toBeVisible();
      act(() => vi.advanceTimersByTime(1));
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(content).toBeVisible();
      expect(content).toHaveAttribute("data-align", "end");
      act(() => screen.getByRole("button", { name: "Inspect context" }).focus());
      fireEvent.pointerLeave(root);
      act(() => vi.advanceTimersByTime(50));
      expect(content).toBeVisible();
      fireEvent.keyDown(screen.getByRole("button", { name: "Inspect context" }), { key: "Escape" });
      expect(trigger).toHaveFocus();
      expect(content).not.toBeVisible();
      view.rerender(fixture(false));
      fireEvent.click(trigger);
      expect(changed).toHaveBeenLastCalledWith(true);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(content).not.toBeVisible();
      view.rerender(fixture(true));
      expect(content).toBeVisible();
    } finally { vi.useRealTimers(); }
  });

  it("Sources custom rendering preserves host children and safe-link policy through disclosure and replacement", async () => {
    const requested = vi.fn();
    const fixture = (safe: boolean) => <Sources defaultOpen><SourcesTrigger count={1}>Read supplied references</SourcesTrigger><SourcesContent><Source href={safe ? "https://example.com/reference" : "javascript:alert(1)"} title="Unused default title" onClick={event => { event.preventDefault(); requested(); }}><strong>{safe ? "Custom reference" : "Unavailable custom reference"}</strong><span> · host annotation</span></Source></SourcesContent></Sources>;
    const view = render(fixture(true));
    const link = screen.getByRole("link", { name: /Custom reference/ });
    expect(link).toHaveAttribute("href", "https://example.com/reference");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(within(link).getByText("Custom reference").tagName).toBe("STRONG");
    expect(within(link).getByText("· host annotation")).toBeVisible();
    expect(screen.queryByText("Unused default title")).toBeNull();
    await userEvent.click(link);
    expect(requested).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Read supplied references" }));
    expect(link).not.toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Read supplied references" }));
    view.rerender(fixture(false));
    expect(screen.queryByRole("link")).toBeNull();
    await userEvent.click(screen.getByText("Unavailable custom reference"));
    expect(requested).toHaveBeenCalledOnce();
    expect(screen.getByText("Unavailable custom reference").closest("a")).toHaveAttribute("aria-disabled", "true");
  });
});
