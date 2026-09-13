import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HarsoChatShell } from "./shell";

let resize: ResizeObserverCallback;
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {}
    disconnect() {}
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); this.querySelector<HTMLButtonElement>("button")?.focus(); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

function width(value: number) {
  act(() => resize([{ contentRect: { width: value } } as ResizeObserverEntry], {} as ResizeObserver));
}

function mount() {
  return render(<div className="harso-kit"><HarsoChatShell title="Conversation foundation" sidebar={<button>New conversation</button>} aside={<p>Working context</p>} main={<p>Thread content</p>} composer={<textarea aria-label="Message" />} actions={<button>Share</button>} themeToggle={<button>Switch theme</button>} /></div>);
}

describe("HarsoChatShell", () => {
  it("renders named regions and header/composer slots", () => {
    mount(); width(1024);
    expect(screen.getByRole("complementary", { name: "Conversation navigation" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Context" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Thread content");
    expect(screen.getByRole("heading", { name: "Conversation foundation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch theme" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Message" })).toBeInTheDocument();
  });

  it("switches data-layout at root widths, not viewport widths", () => {
    const { container } = mount();
    for (const [size, layout] of [[390, "phone"], [640, "phone"], [641, "tablet"], [1023, "tablet"], [1024, "desktop"], [1440, "desktop"]] as const) {
      width(size);
      expect(container.querySelector(".hkc-shell")).toHaveAttribute("data-layout", layout);
    }
  });

  it("closes the phone drawer on Escape and restores toggle focus", () => {
    mount(); width(390);
    const toggle = screen.getByRole("button", { name: "Open conversations" });
    toggle.focus(); fireEvent.click(toggle);
    const dialog = screen.getByRole("dialog", { name: "Conversations" });
    expect(screen.getByRole("button", { name: "Close conversations" })).toHaveFocus();
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it("opens context as a sheet on tablet and closes on backdrop", () => {
    mount(); width(768);
    expect(screen.getByRole("navigation", { name: "Conversation navigation" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open context" }));
    const dialog = screen.getByRole("dialog", { name: "Context" });
    fireEvent.click(dialog, { clientX: 400, clientY: 400 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes an open sheet when the container changes layout", () => {
    mount(); width(390);
    fireEvent.click(screen.getByRole("button", { name: "Open context" }));
    width(1024);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Context" })).toHaveTextContent("Working context");
  });

  it("accepts a custom header and children without an aside", () => {
    render(<HarsoChatShell sidebar="Navigation" header={<h2>Custom header</h2>}>Conversation</HarsoChatShell>);
    width(1024);
    expect(screen.getByRole("heading", { name: "Custom header" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Conversation");
    expect(screen.queryByRole("button", { name: "Open context" })).not.toBeInTheDocument();
  });
});
