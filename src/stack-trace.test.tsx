import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as kit from "./index";

const { StackTrace, StackTraceHeader, StackTraceError, StackTraceErrorType, StackTraceErrorMessage, StackTraceActions, StackTraceCopyButton, StackTraceExpandButton, StackTraceContent, StackTraceFrames } = kit;
const trace = "TypeError: Cannot read result\n    at finish (/src/work.ts:12:8)\n    at C:\\work\\main.ts:20:4\n    at https://sample.invalid:8080/app.js:5:6\n    at node:internal/task:9:2\n    at run (/app/node_modules/lib/index.js:4:1)\nCaused by: raw detail\n    at unknown (native)";
function Example({ value = trace, ...props }: Omit<kit.StackTraceProps, "trace"> & { value?: string }) {
  return <StackTrace trace={value} {...props}><StackTraceHeader><StackTraceError><StackTraceErrorType /><StackTraceErrorMessage /></StackTraceError><StackTraceActions><StackTraceCopyButton /><StackTraceExpandButton /></StackTraceActions></StackTraceHeader><StackTraceContent><StackTraceFrames /></StackTraceContent></StackTrace>;
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("boundaryless stack trace", () => {
  test("ten parts expose native elements, exact header and preserved unknown lines", () => {
    for (const part of [StackTrace, StackTraceHeader, StackTraceError, StackTraceErrorType, StackTraceErrorMessage, StackTraceActions, StackTraceCopyButton, StackTraceExpandButton, StackTraceContent, StackTraceFrames]) expect(part).toBeTypeOf("function");
    render(<Example defaultOpen />);
    expect(screen.getByText("TypeError")).toBeVisible(); expect(screen.getByText("Cannot read result")).toBeVisible();
    expect(screen.getByText("Caused by: raw detail")).toBeVisible(); expect(screen.getByText("at unknown (native)")).toBeVisible();
    expect(screen.getAllByText("Internal")).toHaveLength(2); expect(document.querySelectorAll("button button")).toHaveLength(0);
  });
  test("file callbacks preserve Windows and URL colons and never fire on render", () => {
    const clicked = vi.fn(); render(<Example defaultOpen onFilePathClick={clicked} />); expect(clicked).not.toHaveBeenCalled();
    for (const [path, line, column] of [["/src/work.ts", 12, 8], ["C:\\work\\main.ts", 20, 4], ["https://sample.invalid:8080/app.js", 5, 6]] as const) {
      fireEvent.click(screen.getByRole("button", { name: `${path}:${line}:${column}` })); expect(clicked).toHaveBeenLastCalledWith(path, line, column);
    }
    expect(document.querySelector("a")).toBeNull();
  });
  test("invalid coordinates and nonstandard lines remain literal and inert", () => {
    const lines = ["    at /src/a.ts:0:2", "    at /src/a.ts:-1:2", "    at /src/a.ts:1.5:2", "    at /src/a.ts:9007199254740992:2", "<img src=x onerror=bad()>", "worker@/src/a.ts:2:3"];
    render(<Example value={`Error: bad\n${lines.join("\n")}`} defaultOpen onFilePathClick={vi.fn()} />);
    expect(document.querySelectorAll(".hk-stack-frame button")).toHaveLength(0); expect(document.querySelector("img")).toBeNull();
    for (const line of lines) expect(screen.getByText(line.trim())).toBeVisible();
  });
  test("internal filtering has honest counts and explicit all-hidden and empty states", () => {
    const view = render(<StackTrace trace={"Error: fail\n    at node:internal/task:2:1"} defaultOpen><StackTraceContent><StackTraceFrames showInternalFrames={false} /></StackTraceContent></StackTrace>);
    expect(screen.getByText("1 internal frame hidden")).toBeVisible(); expect(screen.getByText("No visible frames.")).toBeVisible();
    view.rerender(<Example value="" defaultOpen />); expect(screen.getByText("No stack trace supplied.")).toBeVisible(); expect(screen.getByRole("button", { name: "Copy stack trace" })).toBeDisabled();
    view.rerender(<Example value={"Plain message\n\nPreserve second line"} defaultOpen />); expect(screen.getByText("Plain message")).toBeVisible(); expect(screen.getByText("Preserve second line")).toBeVisible();
  });
  test("controlled refusal, disabled actions and focus recovery reuse disclosure", () => {
    const change = vi.fn(); const clicked = vi.fn(); const view = render(<Example open={false} onOpenChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Stack frames" })); expect(change).toHaveBeenCalledWith(true); expect(screen.getByRole("button", { name: "Stack frames" })).toHaveAttribute("aria-expanded", "false");
    view.rerender(<Example open onFilePathClick={clicked} />); screen.getByRole("button", { name: "/src/work.ts:12:8" }).focus();
    view.rerender(<Example open={false} onFilePathClick={clicked} />); expect(screen.getByRole("button", { name: "Stack frames" })).toHaveFocus();
    view.rerender(<Example defaultOpen open disabled onFilePathClick={clicked} />); for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    expect(clicked).not.toHaveBeenCalled();
  });
  test("copy preserves full raw trace without disclosure, bubbling or submission", async () => {
    const write = vi.fn().mockResolvedValue(undefined); vi.stubGlobal("navigator", { clipboard: { writeText: write } }); const bubble = vi.fn(), submit = vi.fn();
    render(<form onSubmit={submit}><div onClick={bubble}><Example /></div></form>);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy stack trace" })));
    expect(write).toHaveBeenCalledExactlyOnceWith(trace); expect(screen.getByRole("status")).toHaveTextContent("Copied"); expect(bubble).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled(); expect(screen.getByRole("button", { name: "Stack frames" })).toHaveAttribute("aria-expanded", "false");
  });
  test("copy errors and stale completion remain isolated after trace replacement", async () => {
    vi.stubGlobal("navigator", {}); const view = render(<Example />); await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy stack trace" }))); expect(screen.getByRole("status")).toHaveTextContent("Copy failed");
    let resolve = () => {}; vi.stubGlobal("navigator", { clipboard: { writeText: () => new Promise<void>(done => { resolve = done; }) } });
    fireEvent.click(screen.getByRole("button", { name: "Copy stack trace" })); expect(screen.getByRole("button", { name: "Copy stack trace" })).toBeDisabled();
    view.rerender(<Example value="Error: replacement" />); await act(async () => resolve()); expect(screen.getByRole("status")).toBeEmptyDOMElement(); expect(screen.getByRole("button", { name: "Copy stack trace" })).toBeEnabled();
  });
  test("refs, custom slots, scrolling and click prevention use native contracts", () => {
    const root = createRef<HTMLDivElement>(), header = createRef<HTMLDivElement>(), button = createRef<HTMLButtonElement>(), content = createRef<HTMLDivElement>();
    const view = render(<StackTrace trace={trace} ref={root} defaultOpen><StackTraceHeader ref={header}><StackTraceErrorType>Custom type</StackTraceErrorType><StackTraceExpandButton ref={button} onClick={event => event.preventDefault()}>Inspect</StackTraceExpandButton></StackTraceHeader><StackTraceContent ref={content} maxHeight={120}><StackTraceFrames /></StackTraceContent></StackTrace>);
    expect(root.current?.tagName).toBe("DIV"); expect(header.current?.tagName).toBe("DIV"); expect(button.current?.tagName).toBe("BUTTON"); expect(content.current).toHaveStyle({ maxHeight: "120px" });
    fireEvent.click(button.current!); expect(button.current).toHaveAttribute("aria-expanded", "true");
    view.rerender(<StackTrace trace={trace}><StackTraceContent ref={content} maxHeight={NaN} /></StackTrace>); expect(content.current).toHaveStyle({ maxHeight: "400px" });
  });
});
