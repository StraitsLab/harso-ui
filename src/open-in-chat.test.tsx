import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MouseEvent } from "react";
import { OpenIn, OpenInChatGPT, OpenInClaude, OpenInContent, OpenInItem, OpenInTrigger } from "./open-in-chat";

describe("OpenIn", () => {
  it("supports disclosure, host refusal, keyboard navigation and disabled links", () => {
    const changed = vi.fn();
    const view = render(<OpenIn query="test" open={false} onOpenChange={changed}><OpenInTrigger /><OpenInContent><OpenInChatGPT /></OpenInContent></OpenIn>);
    fireEvent.click(screen.getByRole("button"));
    expect(changed).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menuitem")).toBeNull();
    view.rerender(<OpenIn key="uncontrolled" query="test" defaultOpen={false}><OpenInTrigger /><OpenInContent><OpenInChatGPT /><OpenInClaude /></OpenInContent></OpenIn>);
    fireEvent.click(screen.getByRole("button"));
    const first = screen.getByRole("menuitem", { name: "ChatGPT" }); first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Claude" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(screen.getByRole("button")).toHaveFocus();
    view.rerender(<OpenIn query="test" disabled open><OpenInTrigger /><OpenInContent><OpenInChatGPT /></OpenInContent></OpenIn>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("menuitem")).not.toHaveAttribute("href");
  });
  it("forwards provider attributes to the actual link and blocks unsafe destinations", () => {
    const click = vi.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault());
    const view = render(<OpenIn query="test"><OpenInContent><OpenInClaude aria-label="Ask Claude" onClick={click} /></OpenInContent></OpenIn>);
    const link = screen.getByRole("menuitem", { name: "Ask Claude" });
    expect(link.tagName).toBe("A"); fireEvent.click(link); expect(click).toHaveBeenCalledOnce();
    view.rerender(<OpenIn query="test"><OpenInContent><OpenInItem href="javascript:alert(1)" label="Unsafe" /><OpenInItem href="https://user:private@example.com" label="Credentials" /></OpenInContent></OpenIn>);
    expect(screen.getByText("Unsafe")).not.toHaveAttribute("href");
    expect(screen.getByText("Credentials")).not.toHaveAttribute("href");
    expect(view.container.innerHTML).not.toContain("private");
  });
  it("encodes the host query into provider links", () => {
    render(<OpenIn query="Explain boundaryless UI"><OpenInContent><OpenInChatGPT /><OpenInClaude /></OpenInContent></OpenIn>);
    expect(screen.getByRole("menuitem", { name: "ChatGPT" })).toHaveAttribute("href", expect.stringContaining("Explain%20boundaryless%20UI"));
    expect(screen.getByRole("menuitem", { name: "Claude" })).toHaveAttribute("href", expect.stringContaining("Explain%20boundaryless%20UI"));
  });
});
