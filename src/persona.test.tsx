import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Persona } from "./misc-surfaces";

describe("original Persona", () => {
  it("stops an initialized reduced-motion renderer even when no CSS animation started", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const ready = vi.fn(), stop = vi.fn();
    try {
      const view = render(<StrictMode><Persona onReady={ready} onStop={stop} /></StrictMode>);
      await waitFor(() => expect(ready).toHaveBeenCalledOnce());
      expect(stop).not.toHaveBeenCalled();
      view.rerender(<StrictMode><Persona state="asleep" onReady={ready} onStop={stop} /></StrictMode>);
      expect(stop).toHaveBeenCalledOnce();
      view.unmount();
      expect(stop).toHaveBeenCalledOnce();
      const again = render(<Persona onReady={ready} onStop={stop} />);
      await waitFor(() => expect(ready).toHaveBeenCalledTimes(2));
      again.unmount();
      expect(stop).toHaveBeenCalledTimes(2);
    } finally { vi.unstubAllGlobals(); }
  });
  it("exposes each named visual structure and every host conversational state", () => {
    const view = render(<Persona />);
    for (const variant of ["obsidian", "mana", "opal", "halo", "glint", "command"] as const) {
      for (const state of ["idle", "listening", "thinking", "speaking", "asleep"] as const) {
        view.rerender(<Persona variant={variant} state={state} />);
        const persona = screen.getByRole("img", { name: `Persona ${state}` });
        expect(persona).toHaveAttribute("data-variant", variant);
        expect(persona.querySelectorAll(".hk-persona-layer")).toHaveLength(3);
        expect(persona).toHaveAttribute("data-playback", state === "asleep" ? "stopped" : "playing");
      }
    }
  });
  it("preserves custom names and styles while bounding invalid size", () => {
    const view = render(<Persona size={Number.NaN} style={{ width: 72 }} aria-label="Assistant is listening" />);
    expect(screen.getByRole("img")).toHaveStyle({ width: "72px" });
    expect(screen.getByRole("img")).toHaveAccessibleName("Assistant is listening");
    view.rerender(<Persona size={-30} />);
    expect(screen.getByRole("img")).toHaveStyle({ width: "24px" });
  });
  it("reports readiness once in StrictMode and playback only on real animation start", async () => {
    const ready = vi.fn(), play = vi.fn(), pause = vi.fn(), stop = vi.fn();
    const view = render(<StrictMode><Persona onReady={ready} onPlay={play} onPause={pause} onStop={stop} /></StrictMode>);
    await waitFor(() => expect(ready).toHaveBeenCalledOnce());
    expect(play).not.toHaveBeenCalled();
    fireEvent.animationStart(screen.getByRole("img").querySelector(".hk-persona-motion")!);
    expect(play).toHaveBeenCalledOnce();
    view.rerender(<StrictMode><Persona paused onReady={ready} onPlay={play} onPause={pause} onStop={stop} /></StrictMode>);
    expect(pause).toHaveBeenCalledOnce();
    view.rerender(<StrictMode><Persona onReady={ready} onPlay={play} onPause={pause} onStop={stop} /></StrictMode>);
    expect(play).toHaveBeenCalledTimes(2);
    view.rerender(<StrictMode><Persona state="asleep" onReady={ready} onPlay={play} onPause={pause} onStop={stop} /></StrictMode>);
    expect(stop).toHaveBeenCalledOnce();
    view.unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
  it("reports readiness before play when the CSS animation starts before the first frame", async () => {
    const events: string[] = [];
    render(<StrictMode><Persona onReady={() => events.push("ready")} onPlay={() => events.push("play")} /></StrictMode>);
    fireEvent.animationStart(screen.getByRole("img").querySelector(".hk-persona-motion")!);
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(events).toEqual(["ready", "play"]);
  });
  it("does not invent play events for initially paused or sleeping visuals", () => {
    const play = vi.fn();
    const view = render(<Persona paused onPlay={play} />);
    fireEvent.animationStart(screen.getByRole("img").querySelector(".hk-persona-motion")!);
    expect(play).not.toHaveBeenCalled();
    view.rerender(<Persona onPlay={play} />);
    expect(play).toHaveBeenCalledOnce();
    view.rerender(<Persona state="asleep" onPlay={play} />);
    expect(play).toHaveBeenCalledOnce();
  });
  it("does not restart playback when host callbacks or visual variants change", () => {
    const first = vi.fn(), next = vi.fn(), stop = vi.fn();
    const view = render(<Persona onPlay={first} onStop={stop} />);
    fireEvent.animationStart(screen.getByRole("img").querySelector(".hk-persona-motion")!);
    view.rerender(<Persona variant="halo" onPlay={next} onStop={stop} />);
    fireEvent.animationStart(screen.getByRole("img").querySelector(".hk-persona-layer")!);
    expect(first).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
    view.unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
});
