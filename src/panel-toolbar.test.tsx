import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./panel";
import { Toolbar } from "./toolbar";

describe("Panel and Toolbar", () => {
  it("renders positioned canvas controls", () => {
    render(<><Panel position="bottom-right">Panel</Panel><Toolbar><button>Action</button></Toolbar></>);
    expect(screen.getByText("Panel")).toHaveClass("hk-panel--bottom-right");
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("honors toolbar visibility and placement without leaking component props", () => {
    const view = render(<Toolbar isVisible={false}><button>Hidden action</button></Toolbar>);
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    view.rerender(<Toolbar position="bottom" offset={12}><button>Visible action</button></Toolbar>);
    expect(screen.getByRole("toolbar")).toHaveClass("hk-toolbar--bottom");
    expect(screen.getByRole("toolbar").style.getPropertyValue("--hk-toolbar-offset")).toBe("12px");
    expect(screen.getByRole("toolbar")).not.toHaveAttribute("isVisible");
    expect(screen.getByRole("toolbar")).not.toHaveAttribute("offset");
  });

  it("moves toolbar focus with arrows and skips disabled actions", () => {
    render(<Toolbar aria-label="Node actions"><button>First</button><button disabled>Disabled</button><button>Last</button></Toolbar>);
    const first = screen.getByRole("button", { name: "First" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(first).toHaveFocus();
  });
  it.each(["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] as const)("supports the host's %s panel placement", position => {
    render(<Panel position={position} aria-label="Inspector" role="region">Panel content</Panel>);
    expect(screen.getByRole("region", { name: "Inspector" })).toHaveClass(`hk-panel--${position}`);
  });
});
