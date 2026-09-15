import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantRuntimeProvider, ComposerPrimitive, useLocalRuntime, type ThreadMessageLike } from "@assistant-ui/react";
import { HarsoThread, type HarsoThreadProps } from "./thread";
import threadCSS from "./thread.css?inline";
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
  test("uses a centred 720px transcript with a single 28px turn gap", () => {
    render(<><style>{threadCSS}</style><Example /></>);
    const style = getComputedStyle(screen.getByRole("log"));
    expect(style.maxWidth).toBe("720px");
    expect(style.gap).toBe("28px");
  });
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
  test("keeps host header/footer inside the scroll viewport and composer outside", () => {
    const { container } = render(<Example header={<button>Earlier history</button>} footer={<aside>Host notice</aside>} empty="No messages" />);
    const viewport = container.querySelector(".hkc-thread-viewport")!;
    expect(viewport).toContainElement(screen.getByRole("button", { name: "Earlier history" }));
    expect(viewport).toContainElement(screen.getByText("Host notice"));
    expect(viewport).not.toContainElement(screen.getByRole("textbox"));
    expect(screen.getByRole("log")).toHaveTextContent("No messages");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("runtime error is distinct from an empty conversation and keeps host slots", async () => {
    render(<Example empty="No messages" header="History controls" footer="Host notice" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "error" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Simulated adapter error");
    expect(screen.queryByText("No messages")).not.toBeInTheDocument();
    expect(screen.getByRole("log")).toHaveTextContent("History controls");
    expect(screen.getByRole("log")).toHaveTextContent("Host notice");
    expect(screen.queryByRole("status", { name: "Streaming" })).not.toBeInTheDocument();
  });

});
