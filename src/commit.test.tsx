import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as kit from "./index";

const { Commit, CommitHeader, CommitAuthor, CommitAuthorAvatar, CommitInfo, CommitMessage, CommitMetadata, CommitHash, CommitSeparator, CommitTimestamp, CommitActions, CommitCopyButton, CommitContent, CommitFiles, CommitFile, CommitFileInfo, CommitFileStatus, CommitFileIcon, CommitFilePath, CommitFileChanges, CommitFileAdditions, CommitFileDeletions } = kit;

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("boundaryless commit summaries", () => {
  test("metadata separators expose a dedicated responsive hook and preserve custom classes", () => {
    render(<CommitSeparator className="host-separator" data-testid="separator" />);
    expect(screen.getByTestId("separator")).toHaveClass("hk-commit-separator", "host-separator");
    expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("separator")).toHaveTextContent("·");
  });
  test("all22 parts compose with native refs and inert supplied strings", () => {
    for (const part of [Commit, CommitHeader, CommitAuthor, CommitAuthorAvatar, CommitInfo, CommitMessage, CommitMetadata, CommitHash, CommitSeparator, CommitTimestamp, CommitActions, CommitCopyButton, CommitContent, CommitFiles, CommitFile, CommitFileInfo, CommitFileStatus, CommitFileIcon, CommitFilePath, CommitFileChanges, CommitFileAdditions, CommitFileDeletions]) expect(part).toBeTypeOf("function");
    const root = createRef<HTMLDivElement>(); const trigger = createRef<HTMLButtonElement>(); const avatar = createRef<HTMLSpanElement>();
    render(<Commit ref={root} defaultOpen><CommitAuthor><CommitAuthorAvatar ref={avatar} initials="AB" /><CommitInfo><CommitMessage>{"<script>no()</script>"}</CommitMessage><CommitMetadata><CommitHash>abc123</CommitHash><CommitSeparator /><span>Author</span></CommitMetadata></CommitInfo></CommitAuthor><CommitHeader ref={trigger}>Changed files</CommitHeader><CommitContent><CommitFiles><CommitFile><CommitFileInfo><CommitFileIcon /><CommitFilePath>src/view.tsx</CommitFilePath><CommitFileStatus status="added" /></CommitFileInfo><CommitFileChanges><CommitFileAdditions count={3} /><CommitFileDeletions count={0} /></CommitFileChanges></CommitFile></CommitFiles></CommitContent></Commit>);
    expect(root.current).toHaveClass("hk-commit"); expect(trigger.current).toHaveAttribute("aria-expanded", "true"); expect(avatar.current).toHaveTextContent("AB");
    expect(root.current?.querySelector("script")).toBeNull(); expect(screen.getByText("<script>no()</script>")).toBeVisible(); expect(screen.getByText("src/view.tsx")).toBeVisible();
    expect(trigger.current?.querySelector("button, input, a")).toBeNull();
  });

  test("controlled refusal and external collapse preserve native disclosure and focus", () => {
    const change = vi.fn();
    const fixture = (open: boolean) => <Commit open={open} onOpenChange={change}><CommitHeader>Files</CommitHeader><CommitContent><button>Inspect</button></CommitContent></Commit>;
    const view = render(fixture(false)); fireEvent.click(screen.getByRole("button", { name: "Files" })); expect(change).toHaveBeenCalledWith(true); expect(screen.queryByRole("button", { name: "Inspect" })).toBeNull();
    view.rerender(fixture(true)); screen.getByRole("button", { name: "Inspect" }).focus(); view.rerender(fixture(false)); expect(screen.getByRole("button", { name: "Files" })).toHaveFocus();
  });

  test("uncontrolled disclosure can be prevented and disabled does not disable host slots", () => {
    const view = render(<Commit><CommitHeader onClick={event => event.preventDefault()}>Files</CommitHeader><CommitContent>Changes</CommitContent></Commit>);
    fireEvent.click(screen.getByRole("button", { name: "Files" })); expect(screen.getByRole("button", { name: "Files" })).toHaveAttribute("aria-expanded", "false");
    view.rerender(<Commit disabled><CommitHeader>Files</CommitHeader><CommitActions><CommitCopyButton hash="abc" /><button type="button">Host action</button></CommitActions></Commit>);
    expect(screen.getByRole("button", { name: "Files" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Copy commit hash" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Host action" })).toBeEnabled();
  });

  test("copy uses full hash without disclosure, bubbling or form submission and resets feedback", async () => {
    vi.useFakeTimers(); const write = vi.fn().mockResolvedValue(undefined); vi.stubGlobal("navigator", { clipboard: { writeText: write } });
    const bubble = vi.fn(); const change = vi.fn(); const copied = vi.fn(); const submit = vi.fn();
    render(<form onSubmit={submit}><div onClick={bubble}><Commit onOpenChange={change}><CommitHeader>Files</CommitHeader><CommitActions><CommitCopyButton hash="0123456789abcdef" onCopy={copied} timeout={25} /></CommitActions></Commit></div></form>);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy commit hash" })));
    expect(write).toHaveBeenCalledExactlyOnceWith("0123456789abcdef"); expect(copied).toHaveBeenCalledOnce(); expect(screen.getByRole("status")).toHaveTextContent("Copied");
    expect(change).not.toHaveBeenCalled(); expect(bubble).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(25)); expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  test("copy rejects missing clipboard, supports prevention and ignores stale completion", async () => {
    const failed = vi.fn(); const copied = vi.fn(); vi.stubGlobal("navigator", {});
    const view = render(<CommitCopyButton hash="old" onError={failed} />);
    await act(async () => fireEvent.click(screen.getByRole("button"))); expect(screen.getByRole("status")).toHaveTextContent("Copy failed"); expect(failed).toHaveBeenCalledOnce();
    let resolve: () => void = () => {}; const write = vi.fn(() => new Promise<void>(done => { resolve = done; })); vi.stubGlobal("navigator", { clipboard: { writeText: write } });
    view.rerender(<CommitCopyButton hash="old" onClick={event => event.preventDefault()} />); fireEvent.click(screen.getByRole("button")); expect(write).not.toHaveBeenCalled();
    view.rerender(<CommitCopyButton hash="old" onCopy={copied} />); fireEvent.click(screen.getByRole("button")); expect(screen.getByRole("button")).toBeDisabled();
    view.rerender(<CommitCopyButton hash="new" onCopy={copied} />); await act(async () => resolve()); expect(copied).not.toHaveBeenCalled(); expect(screen.getByRole("status")).toBeEmptyDOMElement(); expect(screen.getByRole("button")).toBeEnabled();
  });

  test("relative dates retain absolute semantics and invalid dates never throw", () => {
    const date = new Date("2026-09-06T12:00:00Z"); const clock = new Date("2026-09-06T14:00:00Z"); const time = createRef<HTMLTimeElement>();
    const view = render(<CommitTimestamp ref={time} date={date} now={clock} />); expect(time.current).toHaveAttribute("datetime", date.toISOString()); expect(time.current).toHaveTextContent("2 hours ago"); expect(time.current).toHaveAttribute("title", date.toISOString());
    view.rerender(<CommitTimestamp ref={time} date={clock} now={date} />); expect(time.current).toHaveTextContent("in 2 hours");
    view.rerender(<CommitTimestamp ref={time} date={new Date(NaN)} now={clock} />); expect(time.current).toHaveTextContent("Date unavailable"); expect(time.current).not.toHaveAttribute("datetime");
    view.rerender(<CommitTimestamp date={date} now={clock}>At release</CommitTimestamp>); expect(screen.getByText("At release")).toHaveAttribute("datetime", date.toISOString());
  });

  test("status and line counts communicate truth without relying on color", () => {
    const view = render(<><CommitFileStatus status="added" /><CommitFileStatus status="modified" /><CommitFileStatus status="deleted" /><CommitFileStatus status="renamed">Moved</CommitFileStatus><CommitFileAdditions count={0} /><CommitFileDeletions count={12} /></>);
    for (const label of ["Added", "Modified", "Deleted", "Renamed"]) expect(screen.getByLabelText(label)).toBeVisible();
    expect(screen.getByLabelText("0 lines added")).toHaveTextContent("+0"); expect(screen.getByLabelText("12 lines deleted")).toHaveTextContent("−12");
    view.rerender(<><CommitFileAdditions count={NaN} /><CommitFileDeletions count={-1} /><CommitFileAdditions count={1.5} /><CommitFileDeletions count={Infinity} /></>);
    expect(screen.getAllByText("—")).toHaveLength(4); expect(screen.getAllByLabelText(/count unavailable/)).toHaveLength(4);
  });
});
