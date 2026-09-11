import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Terminal, TerminalClearButton, TerminalContent, TerminalCopyButton, TerminalHeader, TerminalTitle } from "./terminal";

describe("Terminal", () => {
  it("respects disabled and prevented clear actions", () => {
    const clear = vi.fn();
    const view = render(<Terminal output="keep" onClear={clear}><TerminalClearButton disabled /></Terminal>);
    expect(screen.getByRole("button")).toBeDisabled();
    view.rerender(<Terminal output="keep" onClear={clear}><TerminalClearButton onClick={event => event.preventDefault()} /></Terminal>);
    fireEvent.click(screen.getByRole("button"));
    expect(clear).not.toHaveBeenCalled();
  });
  it("renders ANSI text as inert output and exposes streaming state", () => {
    render(<Terminal output={'\x1b[32mOK\x1b[0m'} isStreaming><TerminalHeader><TerminalTitle>Build</TerminalTitle><TerminalCopyButton /></TerminalHeader><TerminalContent /></Terminal>);
    expect(screen.getByText("OK")).toBeTruthy();
    expect(screen.getByRole("log")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Copy terminal output")).toBeTruthy();
  });

  it("keeps clear host-owned", () => {
    const onClear = vi.fn();
    render(<Terminal output="x" onClear={onClear} />);
    screen.getByRole("button", { name: "Clear" }).click();
    expect(onClear).toHaveBeenCalledOnce();
  });
});
