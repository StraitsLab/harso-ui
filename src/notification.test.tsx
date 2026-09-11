import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import axe from "axe-core";
import { Notification, NotificationCenter, NotificationViewport, type NotificationCenterItem, type NotificationCenterProps } from "./notification";

expectTypeOf<Parameters<NonNullable<NotificationCenterProps["onSelect"]>>[0]>().toEqualTypeOf<NotificationCenterItem>();

describe("Notification", () => {
  it("pauses dismissal while hidden and restarts on reveal without stale interaction state", () => {
    vi.useFakeTimers();
    try {
      const dismiss = vi.fn();
      const { rerender } = render(<Notification title="Saved" hidden duration={1000} onDismiss={dismiss} />);
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).not.toHaveBeenCalled();
      expect(screen.queryByRole("status")).toBeNull();
      rerender(<Notification title="Saved" duration={1000} onDismiss={dismiss} />);
      act(() => vi.advanceTimersByTime(500));
      rerender(<Notification title="Saved" hidden duration={1000} onDismiss={dismiss} />);
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).not.toHaveBeenCalled();
      rerender(<Notification title="Saved" duration={1000} onDismiss={dismiss} />);
      fireEvent.mouseEnter(screen.getByRole("status"));
      fireEvent.focus(screen.getByRole("button", { name: "Dismiss notification" }));
      rerender(<Notification title="Saved" hidden duration={1000} onDismiss={dismiss} />);
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).not.toHaveBeenCalled();
      rerender(<Notification title="Saved" duration={1000} onDismiss={dismiss} />);
      act(() => vi.advanceTimersByTime(999));
      expect(dismiss).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(dismiss).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it("closed notifications remain mounted for exit motion without timed dismissal", () => {
    vi.useFakeTimers();
    try {
      const dismiss = vi.fn();
      const { rerender } = render(<Notification title="Saved" open={false} duration={1000} onDismiss={dismiss} />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText("Saved")).not.toBeVisible();
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).not.toHaveBeenCalled();
      rerender(<Notification title="Saved" open duration={1000} onDismiss={dismiss} />);
      expect(screen.getByRole("status")).toBeVisible();
      act(() => vi.advanceTimersByTime(1000));
      expect(dismiss).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });

  it("distinguishes an empty filter from an empty notification collection", () => {
    const { rerender } = render(<NotificationCenter items={[{ id: "1", title: "Unread build", category: "system" }]} filter="mentions" />);
    expect(screen.getByRole("status")).toHaveTextContent("No notifications in this filter.");
    expect(screen.queryByText(/caught up/)).not.toBeInTheDocument();
    rerender(<NotificationCenter items={[]} filter="mentions" />);
    expect(screen.getByRole("status")).toHaveTextContent("caught up");
  });

  it("presence is supplied text rather than an invented online state", () => {
    const { rerender } = render(<Notification title="Alex" presence="busy" />);
    expect(screen.getByText("Busy")).toHaveAttribute("data-presence", "busy");
    rerender(<Notification title="Alex" />);
    expect(screen.queryByText("Online")).not.toBeInTheDocument();
    expect(screen.queryByText("Busy")).not.toBeInTheDocument();
  });
  it("announces notifications with an allowed live-region role", async () => {
    const { container } = render(<Notification title="Saved" />);
    const results = await axe.run(container, { runOnly: ["aria-allowed-role"] });
    expect(results.violations).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
  it("timed dismissal waits during pointer or focus interaction and only requests once", () => {
    vi.useFakeTimers();
    try {
      const dismiss = vi.fn();
      const { rerender, unmount } = render(<Notification title="Saved" duration={1000} onDismiss={dismiss} />);
      act(() => vi.advanceTimersByTime(500));
      fireEvent.mouseEnter(screen.getByRole("status"));
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).not.toHaveBeenCalled();
      fireEvent.mouseLeave(screen.getByRole("status"));
      fireEvent.focus(screen.getByRole("button", { name: "Dismiss notification" }));
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).not.toHaveBeenCalled();
      fireEvent.blur(screen.getByRole("button", { name: "Dismiss notification" }));
      act(() => vi.advanceTimersByTime(1000));
      expect(dismiss).toHaveBeenCalledOnce();
      expect(screen.getByText("Saved")).toBeVisible();
      rerender(<Notification title="Saved" duration={1000} onDismiss={() => dismiss()} />);
      act(() => vi.advanceTimersByTime(2000));
      expect(dismiss).toHaveBeenCalledOnce();
      unmount();
      act(() => vi.runAllTimers());
      expect(dismiss).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });

  it("filters and bulk read requests preserve host-owned notification state", () => {
    const markRead = vi.fn();
    const filter = vi.fn();
    const action = vi.fn();
    const items = [{ id: "1", title: "Mention", category: "mentions" as const, action: { label: "Reply", onAction: action } }, { id: "2", title: "Build", category: "system" as const }, { id: "3", title: "Unavailable", disabled: true }];
    const { rerender } = render(<NotificationCenter items={items} filter="all" onFilterChange={filter} onMarkRead={markRead} />);
    fireEvent.click(screen.getByRole("radio", { name: "Mentions" }));
    expect(filter).toHaveBeenCalledWith("mentions");
    expect(screen.getByText("Build")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(markRead.mock.calls).toEqual([["1"], ["2"]]);
    expect(screen.getAllByLabelText("Unread")).toHaveLength(3);
    markRead.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    expect(action).toHaveBeenCalledOnce();
    expect(markRead).toHaveBeenCalledWith("1");
    rerender(<NotificationCenter items={items} filter="mentions" onMarkRead={markRead} disabled />);
    expect(screen.queryByText("Build")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reply" })).toBeDisabled();
    rerender(<NotificationCenter items={items.map(item => ({ ...item, read: true }))} filter="system" onMarkRead={markRead} />);
    expect(screen.getByText("Build")).toBeVisible();
    expect(screen.queryByText("Mention")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Unread")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark all read" })).toBeDisabled();
    rerender(<NotificationCenter items={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("caught up");
  });
  it("supports host-owned dismissal and center selection", () => {
    const dismiss = vi.fn();
    const select = vi.fn();
    render(<><NotificationViewport><Notification title="Saved" description="Your changes are ready." onDismiss={dismiss} /></NotificationViewport><NotificationCenter items={[{ id: "1", title: "Build complete" }]} onSelect={item => { expectTypeOf(item).toEqualTypeOf<NotificationCenterItem>(); select(item); }} /></>);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    fireEvent.click(screen.getByRole("button", { name: /Build complete/ }));
    expect(dismiss).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledWith({ id: "1", title: "Build complete" });
  });
});
