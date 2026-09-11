import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useState } from "react";
import { flushSync } from "react-dom";
import { EnvironmentVariable, EnvironmentVariableCopyButton, EnvironmentVariableName, EnvironmentVariableValue, EnvironmentVariables, EnvironmentVariablesToggle, PackageInfo, PackageInfoChangeType, PackageInfoDependency, PackageInfoName, PackageInfoVersion, Snippet, SnippetCopyButton, SnippetInput } from "./developer-content";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("developer baseline export contracts", () => {
  test.each(["EnvironmentVariables","EnvironmentVariablesHeader","EnvironmentVariablesTitle","EnvironmentVariablesToggle","EnvironmentVariablesContent","EnvironmentVariable","EnvironmentVariableGroup","EnvironmentVariableName","EnvironmentVariableValue","EnvironmentVariableCopyButton","EnvironmentVariableRequired","PackageInfo","PackageInfoHeader","PackageInfoName","PackageInfoChangeType","PackageInfoVersion","PackageInfoDescription","PackageInfoContent","PackageInfoDependencies","PackageInfoDependency","Snippet","SnippetAddon","SnippetText","SnippetInput","SnippetCopyButton"])("developer-content exports %s", async name => {
    const module = await import("./developer-content") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["Commit","CommitHeader","CommitAuthor","CommitAuthorAvatar","CommitInfo","CommitMessage","CommitMetadata","CommitHash","CommitSeparator","CommitTimestamp","CommitActions","CommitCopyButton","CommitContent","CommitFiles","CommitFile","CommitFileInfo","CommitFileStatus","CommitFileIcon","CommitFilePath","CommitFileChanges","CommitFileAdditions","CommitFileDeletions"])("commit exports %s", async name => {
    const module = await import("./commit") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["FileTree","FileTreeFolder","FileTreeFile","FileTreeIcon","FileTreeName","FileTreeActions"])("file-tree exports %s", async name => {
    const module = await import("./file-tree") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["Image"])("image exports %s", async name => {
    const module = await import("./image") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["JsxPreview","JSXPreview","JSXPreviewContent","JSXPreviewError"])("jsx-preview exports %s", async name => {
    const module = await import("./jsx-preview") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["OpenInChat","OpenIn","OpenInTrigger","OpenInContent","OpenInChatGPT","OpenInItem","OpenInClaude","OpenInT3","OpenInScira","OpenInv0","OpenInCursor","OpenInLabel","OpenInSeparator"])("open-in-chat exports %s", async name => {
    const module = await import("./open-in-chat") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["Sandbox","SandboxHeader","SandboxContent","SandboxTabs","SandboxTabsBar","SandboxTabsList","SandboxTabsTrigger","SandboxTabContent"])("sandbox exports %s", async name => {
    const module = await import("./sandbox") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["SchemaDisplay","SchemaDisplayHeader","SchemaDisplayMethod","SchemaDisplayPath","SchemaDisplayDescription","SchemaDisplayContent","SchemaDisplayParameters","SchemaDisplayParameter","SchemaDisplayRequest","SchemaDisplayResponse","SchemaDisplayProperty","SchemaDisplayExample"])("schema-display exports %s", async name => {
    const module = await import("./schema-display") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["StackTrace","StackTraceHeader","StackTraceError","StackTraceErrorType","StackTraceErrorMessage","StackTraceActions","StackTraceCopyButton","StackTraceExpandButton","StackTraceContent","StackTraceFrames"])("stack-trace exports %s", async name => {
    const module = await import("./stack-trace") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["Terminal","TerminalCopyButton","TerminalHeader","TerminalTitle","TerminalStatus","TerminalActions","TerminalClearButton","TerminalContent"])("terminal exports %s", async name => {
    const module = await import("./terminal") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["TestResults","TestSuite","Test","TestResultsHeader","TestResultsSummary","TestResultsDuration","TestResultsProgress","TestResultsContent","TestSuiteName","TestSuiteStats","TestSuiteContent","TestStatus","TestName","TestDuration","TestError","TestErrorMessage","TestErrorStack"])("test-results exports %s", async name => {
    const module = await import("./test-results") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
  test.each(["WebPreview","WebPreviewNavigation","WebPreviewNavigationButton","WebPreviewUrl","WebPreviewBody","WebPreviewConsole"])("web-preview exports %s", async name => {
    const module = await import("./web-preview") as Record<string, unknown>;
    expect(module[name]).toBeTypeOf("function");
  });
});
const clipboard = (writeText = vi.fn().mockResolvedValue(undefined)) => { vi.stubGlobal("navigator", { clipboard: { writeText } }); return writeText; };
const env = (value: string, props: Parameters<typeof EnvironmentVariables>[0] = {}, format: "value" | "name" | "export" = "value", name = "DEMO_KEY") => <EnvironmentVariables {...props}><EnvironmentVariablesToggle /><EnvironmentVariable name={name} value={value}><EnvironmentVariableName /><EnvironmentVariableValue /><EnvironmentVariableCopyButton copyFormat={format} /></EnvironmentVariable></EnvironmentVariables>;

describe("boundaryless developer content", () => {
  test("snippet displays exact inert code and only copies after an explicit allowed click", async () => {
    const write = clipboard(); const copied = vi.fn(); const submit = vi.fn();
    const code = '<script>doNotRun()</script> && echo "sample"';
    const view = render(<form onSubmit={submit}><Snippet code={code}><SnippetInput /><SnippetCopyButton onCopy={copied} /></Snippet></form>);
    expect(screen.getByRole("textbox")).toHaveValue(code);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(view.container.querySelector("script")).toBeNull();
    expect(write).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
    await waitFor(() => expect(copied).toHaveBeenCalledOnce());
    expect(write).toHaveBeenCalledWith(code); expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    view.rerender(<Snippet code="next"><SnippetCopyButton onClick={event => event.preventDefault()} /></Snippet>);
    fireEvent.click(screen.getByRole("button")); expect(write).toHaveBeenCalledTimes(1);
    view.rerender(<Snippet code="next" disabled><SnippetCopyButton /></Snippet>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("copy failure and missing clipboard are honest, retryable and do not leak error text", async () => {
    const write = clipboard(vi.fn().mockRejectedValue(new Error("secret error detail"))); const failed = vi.fn();
    render(<Snippet code="sample"><SnippetCopyButton onError={failed} /></Snippet>);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(failed).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent("Copy failed");
    expect(screen.queryByText(/secret error detail/)).toBeNull();
    expect(screen.getByRole("button")).not.toBeDisabled();
    vi.stubGlobal("navigator", {}); fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(failed).toHaveBeenCalledTimes(2)); expect(write).toHaveBeenCalledTimes(1);
  });

  test("successful copy feedback expires at the supplied timeout without changing code", async () => {
    clipboard(); vi.useFakeTimers();
    render(<Snippet code="unchanged"><SnippetInput /><SnippetCopyButton timeout={50} /></Snippet>);
    await act(async () => { fireEvent.click(screen.getByRole("button")); });
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    act(() => { vi.advanceTimersByTime(49); }); expect(screen.getByRole("status")).toHaveTextContent("Copied");
    act(() => { vi.advanceTimersByTime(1); }); expect(screen.getByRole("status")).toBeEmptyDOMElement(); expect(screen.getByRole("textbox")).toHaveValue("unchanged");
  });

  test("pending completion cannot notify replacement or unmounted content and double clicks are bounded", async () => {
    let resolve: () => void = () => {}; const write = clipboard(vi.fn(() => new Promise<void>(done => { resolve = done; }))); const copied = vi.fn();
    const fixture = (code: string) => <Snippet code={code}><SnippetCopyButton onCopy={copied} /></Snippet>;
    const view = render(fixture("first")); fireEvent.click(screen.getByRole("button")); fireEvent.click(screen.getByRole("button"));
    expect(write).toHaveBeenCalledOnce(); expect(screen.getByRole("button")).toBeDisabled();
    view.rerender(fixture("second")); view.rerender(fixture("first"));
    await act(async () => { resolve(); }); expect(copied).not.toHaveBeenCalled(); expect(screen.getByRole("status")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button")); view.unmount(); await act(async () => { resolve(); }); expect(copied).not.toHaveBeenCalled();
  });

  test("reentrant host replacement, remasking, disabling and unmount cannot start obsolete writes", async () => {
    const write = clipboard(); const copied = vi.fn();
    function Host({ environment, change }: { environment: boolean; change: "replace" | "disable" | "unmount" | "remask" }) {
      const [value, setValue] = useState("old"); const [disabled, setDisabled] = useState(false); const [present, setPresent] = useState(true); const [shown, setShown] = useState(true);
      const onClick = () => flushSync(() => { if (change === "replace") setValue("new"); if (change === "disable") setDisabled(true); if (change === "unmount") setPresent(false); if (change === "remask") setShown(false); });
      if (!present) return null;
      return environment ? <EnvironmentVariables showValues={shown} disabled={disabled}><EnvironmentVariable name="KEY" value={value}><EnvironmentVariableValue /><EnvironmentVariableCopyButton onClick={onClick} onCopy={copied} /></EnvironmentVariable></EnvironmentVariables> : <Snippet code={value} disabled={disabled}><SnippetCopyButton onClick={onClick} onCopy={copied} /></Snippet>;
    }
    for (const environment of [false, true]) for (const change of ["replace", "disable", "unmount", ...(environment ? ["remask"] as const : [])] as const) {
      const view = render(<Host environment={environment} change={change} />);
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(write).not.toHaveBeenCalled(); expect(copied).not.toHaveBeenCalled(); view.unmount();
    }
  });

  test("reentrant clicks reserve one request before invoking host callbacks", async () => {
    const write = clipboard(); let calls = 0;
    render(<Snippet code="sample"><SnippetCopyButton onClick={event => { calls++; if (calls === 1) event.currentTarget.click(); }} /></Snippet>);
    await act(async () => { fireEvent.click(screen.getByRole("button")); });
    expect(calls).toBe(1); expect(write).toHaveBeenCalledOnce();
  });

  test("environment masks rendered values and custom children; name copy needs no reveal", async () => {
    const write = clipboard(); const view = render(env("not-a-real-secret"));
    expect(view.container.innerHTML).not.toContain("not-a-real-secret");
    expect(screen.getByRole("button", { name: /Copy value/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("switch")); expect(screen.getByText("not-a-real-secret")).toBeVisible();
    fireEvent.click(screen.getByRole("button")); await waitFor(() => expect(write).toHaveBeenCalledWith("not-a-real-secret"));
    fireEvent.click(screen.getByRole("switch")); expect(view.container.innerHTML).not.toContain("not-a-real-secret");
    view.rerender(env("not-a-real-secret", {}, "name")); fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(write).toHaveBeenCalledWith("DEMO_KEY"));
    view.rerender(<EnvironmentVariables><EnvironmentVariable name="KEY" value="secret"><EnvironmentVariableValue>custom secret</EnvironmentVariableValue></EnvironmentVariable></EnvironmentVariables>);
    expect(view.container.innerHTML).not.toContain("custom secret"); expect(view.container.innerHTML).not.toContain('value="secret"');
  });

  test("controlled refusal, disabled and prevented reveal never change masking", async () => {
    const changed = vi.fn(() => false); const view = render(env("private", { onShowValuesChange: changed }));
    fireEvent.click(screen.getByRole("switch")); expect(changed).toHaveBeenCalledWith(true); expect(screen.getByRole("switch")).not.toBeChecked();
    view.rerender(env("private", { showValues: false, onShowValuesChange: vi.fn() })); fireEvent.click(screen.getByRole("switch"));
    expect(view.container.innerHTML).not.toContain("private");
    view.rerender(env("private", { disabled: true })); expect(screen.getByRole("switch")).toBeDisabled();
    view.rerender(<EnvironmentVariables><EnvironmentVariablesToggle onChange={event => event.preventDefault()} /></EnvironmentVariables>);
    fireEvent.click(screen.getByRole("switch")); await waitFor(() => expect(screen.getByRole("switch")).not.toBeChecked());
  });

  test("export quoting never interpolates a value and rejects invalid names or NUL", async () => {
    const write = clipboard(); const value = "a'b\n$(echo unsafe)`command`\\\"";
    const view = render(env(value, { showValues: true }, "export")); fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(write).toHaveBeenCalledWith("export DEMO_KEY='a'\\''b\n$(echo unsafe)`command`\\\"'"));
    for (const name of ["BAD;run", "1BAD", "A\nB", "", "KEY=value"]) { view.rerender(env(value, { showValues: true }, "export", name)); expect(screen.getByRole("button")).toBeDisabled(); }
    view.rerender(env("value\0bad", { showValues: true }, "export")); expect(screen.getByRole("button")).toBeDisabled(); expect(write).toHaveBeenCalledOnce();
  });

  test("remasking invalidates copy completion and empty values stay copyable when visible", async () => {
    let resolve: () => void = () => {}; const write = clipboard(vi.fn(() => new Promise<void>(done => { resolve = done; }))); const copied = vi.fn();
    const fixture = (showValues: boolean) => <EnvironmentVariables showValues={showValues}><EnvironmentVariable name="EMPTY" value=""><EnvironmentVariableValue /><EnvironmentVariableCopyButton onCopy={copied} /></EnvironmentVariable></EnvironmentVariables>;
    const view = render(fixture(true)); fireEvent.click(screen.getByRole("button")); expect(write).toHaveBeenCalledWith("");
    view.rerender(fixture(false)); await act(async () => { resolve(); }); expect(copied).not.toHaveBeenCalled(); expect(screen.getByRole("button")).toBeDisabled();
  });

  test("package data preserves explicit versions/change labels and inert missing values", () => {
    const view = render(<PackageInfo name="<img src=x>" currentVersion="0" newVersion="1" changeType="major"><PackageInfoName /><PackageInfoVersion /><PackageInfoChangeType /><PackageInfoDependency name="transitive" /></PackageInfo>);
    expect(screen.getByText("<img src=x>")).toBeVisible(); expect(view.container.querySelector("img")).toBeNull(); expect(screen.getByText("0")).toBeVisible(); expect(screen.getByText("1")).toBeVisible(); expect(screen.getByText("Major")).toBeVisible(); expect(screen.getByText("Version not supplied")).toBeVisible();
    for (const changeType of ["minor", "patch", "added", "removed"] as const) { view.rerender(<PackageInfo name="example" changeType={changeType}><PackageInfoVersion /><PackageInfoChangeType /></PackageInfo>); expect(screen.getByText(changeType[0].toUpperCase() + changeType.slice(1))).toBeVisible(); expect(screen.getByText("Version not supplied")).toBeVisible(); }
  });
});
