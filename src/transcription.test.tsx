import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Transcription, TranscriptionSegment } from "./transcription";

describe("Transcription", () => {
  it("highlights the active segment and seeks through host callback", async () => {
    let seek = 0;
    render(<Transcription segments={[{ text: "Hello", startSecond: 0, endSecond: 1 }, { text: " ", startSecond: 1, endSecond: 2 }, { text: "world", startSecond: 2, endSecond: 3 }]} currentTime={0.5} onSeek={value => { seek = value; }}>{(segment, index) => <TranscriptionSegment segment={segment} index={index} currentTime={0.5} onSeek={value => { seek = value; }} />}</Transcription>);
    expect(screen.getByRole("button", { name: "Hello" })).toHaveAttribute("data-active", "true");
    await userEvent.click(screen.getByRole("button", { name: "world" }));
    expect(seek).toBe(2);
  });
  it("inherits root playback state and seek callbacks without optimistic time changes", async () => {
    const seek = vi.fn();
    const segments = [{ text: "Hello", startSecond: 0, endSecond: 1 }, { text: "world", startSecond: 2, endSecond: 3 }];
    const view = render(<Transcription segments={segments} currentTime={0.5} onSeek={seek}>{(segment, index) => <TranscriptionSegment segment={segment} index={index} />}</Transcription>);
    expect(screen.getByRole("button", { name: "Hello" })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: "world" }));
    expect(seek).toHaveBeenCalledWith(2);
    expect(screen.getByRole("button", { name: "Hello" })).toHaveAttribute("aria-current", "true");
    view.rerender(<Transcription segments={segments} currentTime={2.5} onSeek={seek} />);
    expect(screen.getByRole("button", { name: "world" })).toHaveAttribute("aria-current", "true");
  });
  it("filters empty and invalid segments and makes missing seek capability unavailable", () => {
    render(<Transcription segments={[{ text: " ", startSecond: 0, endSecond: 1 }, { text: "Invalid", startSecond: NaN, endSecond: 3 }, { text: "Readable", startSecond: 1, endSecond: 2 }]} />);
    expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Readable" })).toBeDisabled();
  });
  it("honors cancelled seek, disabled roots and null render output", async () => {
    const seek = vi.fn();
    const segment = { text: "Hello", startSecond: 0, endSecond: 1 };
    const view = render(<Transcription segments={[segment]} onSeek={seek}>{(segment, index) => <TranscriptionSegment segment={segment} index={index} onClick={event => event.preventDefault()} />}</Transcription>);
    await userEvent.click(screen.getByRole("button"));
    expect(seek).not.toHaveBeenCalled();
    view.rerender(<Transcription segments={[segment]} disabled onSeek={seek} />);
    expect(screen.getByRole("button")).toBeDisabled();
    view.rerender(<Transcription segments={[segment]}>{() => null}</Transcription>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
