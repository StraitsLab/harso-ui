import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantRuntimeProvider, ComposerPrimitive, useLocalRuntime, type ThreadMessageLike } from "@assistant-ui/react";
import { HarsoThread, type HarsoThreadProps } from "./thread";
import { createScriptedAdapter } from "./testing/scripted-adapter";

function Example({ messages = [], ...props }: HarsoThreadProps & { messages?: ThreadMessageLike[] }) {
  const [adapter] = useState(() => createScriptedAdapter({ response: "A new answer.", tokenDelayMs: 5, tools: false }));
  const runtime = useLocalRuntime(adapter, { initialMessages: messages });
  return <div className="harso-kit"><AssistantRuntimeProvider runtime={runtime}><HarsoThread {...props} composer={<ComposerPrimitive.Root><ComposerPrimitive.Input aria-label="New message" /><ComposerPrimitive.Send>Send</ComposerPrimitive.Send></ComposerPrimitive.Root>} /></AssistantRuntimeProvider></div>;
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLElement.prototype.scrollTo = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("HarsoThread", () => {
  test("renders its empty state, conversation log and supplied composer", () => {
    render(<Example empty="Ask a question." />);
    expect(screen.getByRole("log", { name: "Conversation" })).toHaveTextContent("Ask a question.");
    expect(screen.getByRole("textbox", { name: "New message" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  test("sending replaces empty state with primitive-backed messages", async () => {
    render(<Example />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("article", { name: "You" })).toHaveTextContent("Hello");
    await waitFor(() => expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("A new answer."));
    expect(screen.queryByText("Start a conversation.")).not.toBeInTheDocument();
  });

  test("honors the message component map", () => {
    render(<Example messages={[{ role: "user", content: "Hello" }]} components={{ UserMessage: () => <article>Custom user</article> }} />);
    expect(screen.getByRole("article")).toHaveTextContent("Custom user");
  });
});
