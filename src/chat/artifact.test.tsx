import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoArtifact } from "./artifact";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const SRC = "# A quieter place to think\n\nThe best workspace leaves room for the work.\n";

test("defaults to the Preview tab and switches to Code, showing line-numbered source", () => {
  render(<HarsoArtifact name="A quieter place to think" meta="Research brief · Markdown" code={SRC} language="markdown" highlightLines={[1]} preview={<p>The best workspace leaves room for the work.</p>} />);
  const preview = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });
  expect(preview).toHaveAttribute("aria-selected", "true");
  expect(codeTab).toHaveAttribute("aria-selected", "false");
  // Preview body shows the rendered node, not raw markdown source.
  expect(screen.getByText("The best workspace leaves room for the work.")).toBeVisible();
  fireEvent.click(codeTab);
  expect(codeTab).toHaveAttribute("aria-selected", "true");
  // Code tab renders per-line rows with a number gutter (via HarsoCodeBlock).
  expect(screen.getByText("# A quieter place to think")).toBeVisible();
});

test("with no preview supplied, renders only the code view and no tablist", () => {
  render(<HarsoArtifact name="notes.md" code={SRC} language="markdown" />);
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(screen.getByText("# A quieter place to think")).toBeVisible();
});

test("copies the raw source and resets its accessible feedback", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<HarsoArtifact name="notes.md" code={SRC} />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy artifact" })); });
  expect(writeText).toHaveBeenCalledWith(SRC);
  expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(screen.getByText("Copied")).toBeVisible();
  act(() => { vi.advanceTimersByTime(2000); });
  expect(screen.getByRole("button", { name: "Copy artifact" })).toBeVisible();
});

test("downloads through the host handler with the artifact filename", () => {
  const onDownload = vi.fn();
  render(<HarsoArtifact name="A quieter place to think" downloadName="brief.md" code={SRC} onDownload={onDownload} />);
  fireEvent.click(screen.getByRole("button", { name: "Download artifact" }));
  expect(onDownload).toHaveBeenCalledWith(SRC, "brief.md");
});

test("renders the Expand control only when a handler is supplied", () => {
  const onExpand = vi.fn();
  const { rerender } = render(<HarsoArtifact name="notes.md" code={SRC} />);
  expect(screen.queryByRole("button", { name: "Expand artifact" })).toBeNull();
  rerender(<HarsoArtifact name="notes.md" code={SRC} onExpand={onExpand} />);
  fireEvent.click(screen.getByRole("button", { name: "Expand artifact" }));
  expect(onExpand).toHaveBeenCalledOnce();
});
