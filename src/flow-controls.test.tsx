import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Controls } from "./flow-controls";

describe("Controls", () => {
  it("delegates canvas actions to the host", async () => {
    let zoomed = false;
    render(<Controls onZoomIn={() => { zoomed = true; }} />);
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(zoomed).toBe(true);
  });
  it("disables absent actions and does not pretend a refused toggle changed host state", async () => {
    const toggle = vi.fn();
    const view = render(<Controls showInteractive interactive={false} onToggleInteractive={toggle} />);
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fit view" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Toggle interactivity" }));
    expect(toggle).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Toggle interactivity" })).toHaveAttribute("aria-pressed", "false");
    view.rerender(<Controls showInteractive interactive disabled onToggleInteractive={toggle} />);
    expect(screen.getByRole("button", { name: "Toggle interactivity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Toggle interactivity" })).toHaveAttribute("aria-pressed", "true");
  });
});
