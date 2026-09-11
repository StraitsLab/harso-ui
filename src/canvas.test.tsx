import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Canvas } from "./canvas";
import { Controls } from "./flow-controls";
import { Node } from "./node";

describe("Canvas", () => {
  it("renders the presentation container and configuration markers only", () => {
    const { container } = render(<Canvas><div>Node</div></Canvas>);
    const canvas = container.firstElementChild;
    expect(canvas).toHaveAttribute("data-pan-on-scroll", "true");
    expect(canvas).toHaveTextContent("Node");
  });

  it("pans and zooms native wheel events, honors flags, and accepts keyboard reset", () => {
    const view = render(<Canvas><div>Content</div></Canvas>);
    const canvas = screen.getByRole("region", { name: "Canvas" });
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 10, deltaY: 20 });
    act(() => canvas.dispatchEvent(wheel));
    expect(view.container.querySelector(".hk-canvas-viewport")).toHaveStyle({ transform: "translate(-10px, -20px) scale(1)" });
    expect(wheel.defaultPrevented).toBe(true);
    fireEvent.keyDown(canvas, { key: "+" });
    expect(view.container.querySelector(".hk-canvas-viewport")?.getAttribute("style")).toContain("scale(1.2)");
    fireEvent.keyDown(canvas, { key: "Home" });
    expect(view.container.querySelector(".hk-canvas-viewport")).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
    view.rerender(<Canvas panOnScroll={false} zoomOnScroll={false} />);
    const ignored = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 20 });
    act(() => canvas.dispatchEvent(ignored));
    expect(ignored.defaultPrevented).toBe(false);
  });

  it("requests controlled viewport changes without bypassing refusal or disabled state", () => {
    const changed = vi.fn();
    const view = render(<Canvas viewport={{ x: 4, y: 6, zoom: 1 }} onViewportChange={changed} />);
    const canvas = screen.getByRole("region");
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(changed).toHaveBeenCalledWith({ x: 24, y: 6, zoom: 1 });
    expect(view.container.querySelector(".hk-canvas-viewport")).toHaveStyle({ transform: "translate(4px, 6px) scale(1)" });
    view.rerender(<Canvas onViewportChange={() => false} />);
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(view.container.querySelector(".hk-canvas-viewport")).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
    changed.mockClear();
    view.rerender(<Canvas disabled onViewportChange={changed} />);
    fireEvent.keyDown(canvas, { key: "+" });
    act(() => canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 20 })));
    expect(changed).not.toHaveBeenCalled();
    expect(canvas).toHaveAttribute("aria-disabled", "true");
  });

  it("bounds native wheel zoom, honors cancellation and removes the native listener", () => {
    const changed = vi.fn();
    const view = render(<Canvas onViewportChange={changed} onKeyDown={event => event.preventDefault()} />);
    const canvas = screen.getByRole("region");
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(changed).not.toHaveBeenCalled();
    act(() => canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -10000 })));
    expect(changed.mock.lastCall?.[0].zoom).toBe(4);
    view.rerender(<Canvas zoomOnScroll={false} onViewportChange={changed} />);
    changed.mockClear();
    const ignored = new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: 20 });
    act(() => canvas.dispatchEvent(ignored));
    expect(ignored.defaultPrevented).toBe(false);
    expect(changed).not.toHaveBeenCalled();
    const remove = vi.spyOn(canvas, "removeEventListener");
    view.unmount();
    expect(remove).toHaveBeenCalledWith("wheel", expect.any(Function));
  });

  it("allows the host to reject selection and interactive toggle requests", () => {
    const selection = vi.fn(() => false);
    const interactive = vi.fn(() => false);
    render(<Canvas onSelectionChange={selection} onInteractiveChange={interactive} overlay={<Controls showInteractive />}><Node nodeId="one">One</Node></Canvas>);
    fireEvent.keyDown(screen.getByRole("region"), { key: "a", ctrlKey: true });
    expect(selection).toHaveBeenCalledWith(["one"]);
    expect(screen.getByRole("article")).not.toHaveAttribute("data-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Toggle interactivity" }));
    expect(interactive).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Toggle interactivity" })).toHaveAttribute("aria-pressed", "true");
  });

  it("wires overlay Controls to the presentation viewport and never hijacks child keyboard input", () => {
    const view = render(<Canvas overlay={<Controls showInteractive />}><input aria-label="Editor" /></Canvas>);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(view.container.querySelector(".hk-canvas-viewport")?.getAttribute("style")).toContain("scale(1.2)");
    fireEvent.click(screen.getByRole("button", { name: "Fit view" }));
    expect(view.container.querySelector(".hk-canvas-viewport")?.getAttribute("style")).toContain("scale(1)");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowRight" });
    expect(view.container.querySelector(".hk-canvas-viewport")).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
    fireEvent.click(screen.getByRole("button", { name: "Toggle interactivity" }));
    expect(screen.getByRole("button", { name: "Toggle interactivity" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  });

  it("selects intersecting nodes by pointer, preserves controlled refusal and cancels gestures", () => {
    const pointer = (element: Element, type: string, x: number, y: number) => {
      const event = new Event(type, { bubbles: true });
      Object.assign(event, { pointerId: 1, button: 0, clientX: x, clientY: y });
      fireEvent(element, event);
    };
    const changed = vi.fn();
    const view = render(<Canvas onSelectionChange={changed}><Node nodeId="one">One</Node></Canvas>);
    const canvas = screen.getByRole("region");
    vi.spyOn(screen.getByRole("article"), "getBoundingClientRect").mockReturnValue({ left: 10, top: 10, right: 40, bottom: 40, width: 30, height: 30, x: 10, y: 10, toJSON: () => ({}) });
    pointer(canvas, "pointerdown", 0, 0); pointer(canvas, "pointermove", 50, 50); pointer(canvas, "pointerup", 50, 50);
    expect(changed).toHaveBeenCalledWith(["one"]);
    expect(screen.getByRole("article")).toHaveAttribute("data-selected", "true");
    view.rerender(<Canvas selectedIds={[]} onSelectionChange={changed}><Node nodeId="one">One</Node></Canvas>);
    pointer(canvas, "pointerdown", 0, 0); pointer(canvas, "pointerup", 50, 50);
    expect(screen.getByRole("article")).not.toHaveAttribute("data-selected", "true");
    changed.mockClear();
    pointer(canvas, "pointerdown", 0, 0); pointer(canvas, "pointercancel", 50, 50);
    expect(changed).not.toHaveBeenCalled();
    expect(view.container.querySelector(".hk-canvas-selection")).toBeNull();
    view.rerender(<Canvas selectionOnDrag={false} />);
    pointer(canvas, "pointerdown", 0, 0); pointer(canvas, "pointermove", 30, 40); pointer(canvas, "pointerup", 30, 40);
    expect(view.container.querySelector(".hk-canvas-viewport")).toHaveStyle({ transform: "translate(30px, 40px) scale(1)" });
  });
});
