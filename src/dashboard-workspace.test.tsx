import { createRef } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DashboardWorkspace } from "./dashboard-workspace";
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
describe("private dashboard workspace", () => {
  it("keeps section refs, navigation and panel drafts mounted through 640/900 transitions", () => {
    let resize: ResizeObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class { constructor(callback: ResizeObserverCallback) { resize = callback; } observe() {} disconnect = disconnect; });
    try {
      const ref = createRef<HTMLElement>(); const close = vi.fn();
      const view = render(<DashboardWorkspace ref={ref} navigation={<input aria-label="Navigation draft" />} panel={{ title: "Editor", content: <input aria-label="Panel draft" />, onClose: close }}><p>Dashboard data</p></DashboardWorkspace>);
      const nav = screen.getByLabelText("Navigation draft"); const editor = screen.getByLabelText("Panel draft");
      fireEvent.change(nav, { target: { value: "Nav state" } }); fireEvent.change(editor, { target: { value: "Panel state" } }); editor.focus();
      for (const width of [1200, 899, 640, 641, 900]) {
        act(() => resize([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver));
        expect(ref.current).toHaveAttribute("data-compact", String(width < 900));
        expect(ref.current).toHaveAttribute("data-navigation", String(width > 640));
        expect(screen.getByLabelText("Navigation draft")).toBe(nav);
        expect(screen.getByLabelText("Panel draft")).toBe(editor);
        expect(editor).toHaveFocus(); expect(editor).toHaveValue("Panel state"); expect(nav).toHaveValue("Nav state");
      }
      expect(ref.current?.tagName).toBe("SECTION");
      expect(view.container.querySelector('[class*="hk-ai-"], .hk-conversation, .hk-prompt-input, .hk-message')).toBeNull();
      fireEvent.keyDown(nav, { key: "Escape" });
      expect(screen.getByRole("button", { name: "Toggle workspace navigation" })).toHaveFocus();
      expect(close).not.toHaveBeenCalled();
      view.unmount(); expect(disconnect).toHaveBeenCalledOnce(); expect(ref.current).toBeNull();
    } finally { vi.unstubAllGlobals(); }
  });
  it("workspace keyboard toggles navigation and restores focus after host-approved Escape closure", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const navigation = <button>Destination</button>;
    const view = render(<DashboardWorkspace navigation={navigation} />);
    const toggle = screen.getByRole("button", { name: "Toggle workspace navigation" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    view.rerender(<DashboardWorkspace navigation={navigation} panel={{ title: "Context", content: <input aria-label="Panel draft" />, onClose: close }} />);
    fireEvent(screen.getByRole("dialog", { name: "Context" }), new Event("cancel", { cancelable: true }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Context" })).toBeVisible();
    view.rerender(<DashboardWorkspace navigation={navigation} />);
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it("Dashboard workspace composes navigation, dashboard children and actions without placeholder behavior", () => {
    render(<DashboardWorkspace title="Build a page" navigation={<button>Repository</button>} actions={<button>Changes</button>} status={<span>Running</span>}><p>Host dashboard</p><textarea aria-label="Editor" /></DashboardWorkspace>);
    expect(screen.getByRole("navigation", { name: "Dashboard workspace" })).toHaveTextContent("Repository");
    expect(screen.getByRole("button", { name: "Changes" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Editor" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Toggle workspace navigation" }));
    expect(screen.getByRole("button", { name: "Toggle workspace navigation" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Repository" })).not.toBeInTheDocument();
    expect(screen.getByText("Host dashboard")).toBeVisible();
  });

  it("Dashboard workspace panel dismissal is host controlled and updates one panel", () => {
    const close = vi.fn();
    const view = render(<DashboardWorkspace panel={{ title: "Changes", content: <p>Diff content</p>, onClose: close }}>Dashboard content</DashboardWorkspace>);
    expect(screen.getByRole("dialog", { name: "Changes" })).toHaveTextContent("Diff content");
    fireEvent.click(screen.getByRole("button", { name: "Close context panel" }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { name: "Changes" })).toBeVisible();
    view.rerender(<DashboardWorkspace panel={{ title: "Browser", content: <p>Preview content</p>, onClose: close }}>Dashboard content</DashboardWorkspace>);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Browser" })).toHaveTextContent("Preview content");
    view.rerender(<DashboardWorkspace>Dashboard content</DashboardWorkspace>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
