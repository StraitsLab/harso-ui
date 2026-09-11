import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AgentLimitsCard, AgentProgress, AgentThinking, AiChat, AiImageGeneration, AiProfile, ChatStarter, TaskList, WebSearch } from "./agent-surfaces";
import chartStyles from "./chart-cards.css?raw";
import agentStyles from "./agent-surfaces.css?raw";
import userEvent from "@testing-library/user-event";

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    show: { configurable: true, value() { this.open = true; } },
    showModal: { configurable: true, value() { this.open = true; } },
    close: { configurable: true, value() { this.open = false; } },
  });
});
afterAll(() => {
  for (const method of ["show", "showModal", "close"]) Reflect.deleteProperty(HTMLDialogElement.prototype, method);
});

describe("agent surfaces", () => {
  it("workspace keyboard toggles navigation and restores focus after host-approved Escape closure", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const navigation = <button>Destination</button>;
    const view = render(<AiChat navigation={navigation} />);
    const toggle = screen.getByRole("button", { name: "Toggle workspace navigation" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    view.rerender(<AiChat navigation={navigation} panel={{ title: "Context", content: <input aria-label="Panel draft" />, onClose: close }} />);
    fireEvent(screen.getByRole("dialog", { name: "Context" }), new Event("cancel", { cancelable: true }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Context" })).toBeVisible();
    view.rerender(<AiChat navigation={navigation} />);
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it("starter missing pages and missing handlers do not pretend to navigate or authenticate", () => {
    const view = render(<ChatStarter view="sign-in" />);
    expect(screen.getByText("No sign-in content supplied.")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    view.rerender(<ChatStarter suggestions={["Inspect work"]} />);
    expect(screen.getByRole("button", { name: "Inspect work" })).toBeDisabled();
  });
  it("profile template bars stay in their grid cell instead of escaping the scroll region", () => {
    const style = document.createElement("style");
    style.textContent = chartStyles + agentStyles;
    document.head.append(style);
    try {
      const view = render(<AiProfile name="Mira" agents={<div className="hk-profile-agent-series"><div className="hk-chart-bar-column"><span className="hk-chart-bar" /></div></div>} />);
      expect(getComputedStyle(view.container.querySelector(".hk-chart-bar")!).position).toBe("static");
    } finally { style.remove(); }
  });
  it("AI profile composes identity, cover and data slots with host-owned edit/share", () => {
    const edit = vi.fn(); const share = vi.fn();
    render(<AiProfile name="Mira" description="Designer" cover={<div role="img" aria-label="Landscape cover" />} contributions={<p>Contribution metrics</p>} activity={<p>Activity grid</p>} agents={<p>Agents chart</p>} tokens={<p>Token trend</p>} onEdit={edit} onShare={share}>Additional profile content</AiProfile>);
    expect(screen.getByRole("heading", { name: "Mira" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Landscape cover" })).toBeVisible();
    for (const text of ["Designer", "Contribution metrics", "Activity grid", "Agents chart", "Token trend", "Additional profile content"]) expect(screen.getByText(text)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Share profile" }));
    expect(edit).toHaveBeenCalledOnce(); expect(share).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("AI profile disables missing or disabled action handlers and supports one controlled panel", () => {
    const edit = vi.fn(); const close = vi.fn();
    const view = render(<AiProfile name="Mira" disabled onEdit={edit} />);
    const editButton = screen.getByRole("button", { name: "Edit profile" });
    expect(editButton).toBeDisabled(); fireEvent.click(editButton); expect(edit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Share profile" })).toBeDisabled();
    view.rerender(<AiProfile name="Mira" disabled onEdit={edit} panel={{ title: "Edit profile", content: <p>Edit form</p>, onClose: close }} />);
    expect(screen.getByRole("dialog", { name: "Edit profile" })).toHaveTextContent("Edit form");
    fireEvent.click(screen.getByRole("button", { name: "Close context panel" }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeVisible();
    view.rerender(<AiProfile name="Mira" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeDisabled();
  });

  it("image generation composes host slots and reports only supplied estimates", () => {
    const view = render(<AiImageGeneration state="generating" remainingSeconds={12} navigation={<button>Image agent</button>} composer={<textarea aria-label="Image prompt" />} feedback={<button>Helpful image</button>}><p>Prompt thread</p></AiImageGeneration>);
    expect(screen.getByRole("navigation")).toHaveTextContent("Image agent");
    expect(screen.getByRole("textbox", { name: "Image prompt" })).toBeVisible();
    expect(screen.getByText("Estimated 12 seconds remaining")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Helpful image" })).not.toBeInTheDocument();
    view.rerender(<AiImageGeneration state="generating" remainingSeconds={NaN} />);
    expect(screen.queryByText(/seconds remaining/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Generating image");
    view.rerender(<AiImageGeneration state="stopped" remainingSeconds={8} />);
    expect(screen.getByRole("status")).toHaveTextContent("Generation stopped");
    expect(screen.queryByText(/seconds remaining/)).not.toBeInTheDocument();
  });

  it("image generation preserves simple output and recovers when image identity changes", () => {
    const retry = vi.fn();
    const view = render(<AiImageGeneration src="/first.svg" alt="Quiet landscape" prompt="Make a landscape" feedback={<button>Helpful image</button>} onRetry={retry} />);
    expect(screen.getByRole("img", { name: "Quiet landscape" })).toHaveAttribute("src", "/first.svg");
    expect(screen.getByText("Make a landscape")).toBeVisible();
    fireEvent.error(screen.getByRole("img", { name: "Quiet landscape" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Image could not be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Retry generation" }));
    expect(retry).toHaveBeenCalledOnce();
    view.rerender(<AiImageGeneration src="/first.svg" state="stopped" />);
    expect(screen.getByRole("status")).toHaveTextContent("Generation stopped");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    view.rerender(<AiImageGeneration src="/first.svg" state="idle" />);
    expect(screen.getByRole("status")).toHaveTextContent("Describe an image to begin");
    view.rerender(<AiImageGeneration src="/second.svg" alt="New landscape" />);
    expect(screen.getByRole("img", { name: "New landscape" })).toHaveAttribute("src", "/second.svg");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("failed generation is host controlled and disabled retry cannot call the host", () => {
    const retry = vi.fn();
    const view = render(<AiImageGeneration state="failed" error="Capacity unavailable" onRetry={retry} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "Retry generation" }));
    expect(retry).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Capacity unavailable");
    view.rerender(<AiImageGeneration state="complete" />);
    expect(screen.getByRole("status")).toHaveTextContent("No image supplied");
  });

  it("ChatStarter composes pages and only renders the chat composer on chat", () => {
    const props = { teamMenu: <button>Team</button>, userMenu: <button>Account</button>, history: <p>History rail</p>, composer: <textarea aria-label="Draft" />, dashboard: <p>Dashboard page</p>, signIn: <p>Sign-in page</p>, signUp: <p>Sign-up page</p> };
    const view = render(<ChatStarter {...props}>Messages</ChatStarter>);
    expect(screen.getByRole("navigation")).toHaveTextContent("History rail");
    expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
    for (const [viewName, text] of [["dashboard", "Dashboard page"], ["sign-in", "Sign-in page"], ["sign-up", "Sign-up page"]] as const) {
      view.rerender(<ChatStarter {...props} view={viewName}>Messages</ChatStarter>);
      expect(screen.getByText(text)).toBeVisible();
      expect(screen.queryByRole("textbox", { name: "Draft" })).not.toBeInTheDocument();
      expect(screen.queryByText("Messages")).not.toBeInTheDocument();
    }
  });

  it("ChatStarter disabled suggestions cannot issue host requests", () => {
    const select = vi.fn();
    render(<ChatStarter disabled suggestions={["Review work"]} onSelect={select} />);
    fireEvent.click(screen.getByRole("button", { name: "Review work" }));
    expect(select).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Review work" })).toBeDisabled();
  });

  it("AI Chat composes navigation, conversation, actions and composer without placeholder behavior", () => {
    render(<AiChat title="Build a page" navigation={<button>Repository</button>} actions={<button>Changes</button>} composer={<textarea aria-label="Message" />} status={<span>Running</span>}><p>Host message</p></AiChat>);
    expect(screen.getByRole("navigation", { name: "Chat workspace" })).toHaveTextContent("Repository");
    expect(screen.getByRole("button", { name: "Changes" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Message" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Toggle workspace navigation" }));
    expect(screen.getByRole("button", { name: "Toggle workspace navigation" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Repository" })).not.toBeInTheDocument();
    expect(screen.getByText("Host message")).toBeVisible();
  });

  it("AI Chat panel dismissal is host controlled and updates one panel", () => {
    const close = vi.fn();
    const view = render(<AiChat panel={{ title: "Changes", content: <p>Diff content</p>, onClose: close }}>Thread</AiChat>);
    expect(screen.getByRole("dialog", { name: "Changes" })).toHaveTextContent("Diff content");
    fireEvent.click(screen.getByRole("button", { name: "Close context panel" }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { name: "Changes" })).toBeVisible();
    view.rerender(<AiChat panel={{ title: "Browser", content: <p>Preview content</p>, onClose: close }}>Thread</AiChat>);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Browser" })).toHaveTextContent("Preview content");
    view.rerender(<AiChat>Thread</AiChat>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders host-fed progress and interactions", () => {
    const onSelect = vi.fn();
    render(<><AgentLimitsCard used={20} maximum={100} /><AgentProgress steps={["Plan", "Build"]} current={1} /><AgentThinking /><ChatStarter suggestions={["Inspect"]} onSelect={onSelect} /><TaskList tasks={[{ id: "1", label: "Done", status: "complete" }]} /><WebSearch query="harso" searchResults={[{ title: "Harso", url: "https://example.com" }]} /></>);
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    expect(onSelect).toHaveBeenCalledWith("Inspect");
    expect(screen.getByText("Harso")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
