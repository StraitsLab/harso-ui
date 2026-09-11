import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Attachment, AttachmentInfo, AttachmentPreview, AttachmentProgress, AttachmentRemove, AttachmentRetry, Attachments, AttachmentHoverCard, AttachmentHoverCardTrigger, AttachmentHoverCardContent, getMediaCategory, getAttachmentLabel } from "./attachments";

describe("Attachments", () => {
  it("opens hover content after delays, retains focus, dismisses with Escape and honors refusal", () => {
    vi.useFakeTimers();
    try {
      const changed = vi.fn();
      const view = (open?: boolean) => <AttachmentHoverCard open={open} onOpenChange={changed} openDelay={100} closeDelay={50}><AttachmentHoverCardTrigger>Preview</AttachmentHoverCardTrigger><AttachmentHoverCardContent><button>Inspect file</button></AttachmentHoverCardContent></AttachmentHoverCard>;
      const { rerender } = render(view());
      const trigger = screen.getByRole("button", { name: "Preview" });
      fireEvent.pointerEnter(trigger);
      expect(screen.queryByRole("button", { name: "Inspect file" })).toBeNull();
      act(() => vi.advanceTimersByTime(100));
      expect(screen.getByRole("button", { name: "Inspect file" })).toBeVisible();
      act(() => trigger.focus());
      fireEvent.pointerLeave(trigger);
      act(() => vi.advanceTimersByTime(50));
      expect(screen.getByRole("button", { name: "Inspect file" })).toBeVisible();
      fireEvent.keyDown(trigger, { key: "Escape" });
      expect(screen.queryByRole("button", { name: "Inspect file" })).toBeNull();
      rerender(view(false));
      fireEvent.click(trigger);
      expect(changed).toHaveBeenLastCalledWith(true);
      expect(screen.queryByRole("button", { name: "Inspect file" })).toBeNull();
    } finally { vi.useRealTimers(); }
  });
  it("classifies supplied media and labels missing metadata without inventing a filename", () => {
    for (const category of ["image", "audio", "video"]) expect(getMediaCategory({ id: category, mediaType: `${category}/test` })).toBe(category);
    expect(getMediaCategory({ id: "file", mediaType: "application/pdf" })).toBe("file");
    expect(getMediaCategory({ id: "unknown" })).toBe("file");
    expect(getAttachmentLabel({ id: "1", name: "report.pdf" })).toBe("report.pdf");
    expect(getAttachmentLabel({ id: "2", mediaType: "application/pdf" })).toBe("application/pdf");
    expect(getAttachmentLabel({ id: "3" })).toBe("Attachment");
  });
  it("allows cancelled removal and retry requests and disables unwired actions", () => {
    const remove = vi.fn(), retry = vi.fn();
    const view = (wired: boolean) => <Attachments><Attachment data={{ id: "1", status: "error" }} onRemove={wired ? remove : undefined} onRetry={wired ? retry : undefined}><AttachmentRemove onClick={wired ? event => event.preventDefault() : undefined} /><AttachmentRetry onClick={wired ? event => event.preventDefault() : undefined} /></Attachment></Attachments>;
    const { rerender } = render(view(true));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(remove).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    rerender(view(false));
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
  });
  it("renders safe metadata and delegates removal", () => {
    const onRemove = vi.fn();
    render(<Attachments variant="list"><Attachment data={{ id: "1", name: "photo.png", mediaType: "image/png", size: 2048 }} onRemove={onRemove}><AttachmentPreview /><AttachmentInfo showMediaType /><AttachmentRemove /></Attachment></Attachments>);
    expect(screen.getByText("photo.png")).toBeTruthy();
    expect(screen.getByText("image/png")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("exposes progress and retries through host callbacks", () => {
    const onRetry = vi.fn();
    render(<Attachments variant="list"><Attachment data={{ id: "2", name: "upload.zip", status: "uploading", progress: 42 }}><AttachmentInfo /><AttachmentPreview /><AttachmentProgress /></Attachment><Attachment data={{ id: "3", name: "failed.txt", status: "error", error: "Upload failed" }} onRetry={onRetry}><AttachmentInfo /><AttachmentRetry /></Attachment></Attachments>);
    expect(screen.getByRole("progressbar", { name: "Uploading upload.zip" })).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
