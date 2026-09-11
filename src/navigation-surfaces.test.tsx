import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Carousel, CarouselItem, Dropdown, DropdownDivider, DropdownGroup, DropdownItem, DropdownPopover, DropdownTrigger, Sidebar, SidebarItem } from "./navigation-surfaces";

describe("boundaryless navigation surfaces", () => {
  test("menu parts expose grouped choices, separated descriptions, disabled actions and refs", () => {
    const trigger = createRef<HTMLButtonElement>();
    const panel = createRef<HTMLDivElement>();
    const select = vi.fn();
    render(<Dropdown label="Model menu"><DropdownTrigger ref={trigger}>Choose model</DropdownTrigger><DropdownPopover ref={panel}><DropdownGroup label="Models"><DropdownItem label="Balanced" description="Everyday work" selected onSelect={select} /><DropdownItem label="Unavailable" disabled onSelect={select} /></DropdownGroup><DropdownDivider /><DropdownItem label="Settings" onSelect={select} /></DropdownPopover></Dropdown>);
    expect(trigger.current).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger.current).toHaveAttribute("aria-controls", panel.current?.id);
    expect(panel.current).toHaveAttribute("role", "menu");
    expect(screen.getByRole("menuitemradio", { name: "Balanced", hidden: true })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Balanced", hidden: true })).toHaveAccessibleDescription("Everyday work");
    fireEvent.click(screen.getByRole("menuitem", { name: "Unavailable", hidden: true }));
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Balanced", hidden: true }));
    expect(select).toHaveBeenCalledOnce();
    expect(screen.getByRole("separator", { hidden: true })).toBeInTheDocument();
  });

  test("unsupported native popovers do not expose a working trigger", () => {
    render(<Dropdown label="Actions"><DropdownTrigger>Open actions</DropdownTrigger><DropdownPopover><DropdownItem label="Action" /></DropdownPopover></Dropdown>);
    expect(screen.getByRole("button", { name: "Open actions" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions" })).toHaveAttribute("aria-expanded", "false");
  });

  test("sidebar can decline collapse and navigation without losing supplied names or counts", () => {
    const collapse = vi.fn();
    const select = vi.fn();
    const { rerender } = render(<Sidebar label="Workspace" collapsed={false} onCollapsedChange={collapse}><SidebarItem label="Inbox" badge={3} selected onSelect={select} /><SidebarItem label="Unavailable" href="#blocked" disabled onSelect={select} /></Sidebar>);
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(collapse).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Collapse navigation" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Inbox, 3" }));
    expect(select).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("link", { name: "Unavailable" }));
    expect(select).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Unavailable" })).not.toHaveAttribute("href");
    rerender(<Sidebar label="Workspace" collapsed onCollapsedChange={collapse}><SidebarItem label="Inbox" badge={3} selected /></Sidebar>);
    expect(screen.getByRole("button", { name: "Inbox, 3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Expand navigation" })).toHaveAttribute("aria-expanded", "false");
  });

  test("uncontrolled collapse retains child input state and native links", () => {
    render(<Sidebar label="Research" header={<input aria-label="Search" defaultValue="Initial" />}><SidebarItem label="Notes" href="#notes" /></Sidebar>);
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "Draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(screen.getByRole("textbox", { name: "Search" })).toBe(input);
    expect(input).toHaveValue("Draft");
    expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "#notes");
  });

  test("carousel items stay mounted when controls and alignment change", () => {
    function Example() {
      const [center, setCenter] = useState(false);
      return <><button onClick={() => setCenter(value => !value)}>Change alignment</button><Carousel label="Results" align={center ? "center" : "start"} showArrows={!center} showDots={!center}><CarouselItem label="Brief" width="75%"><input aria-label="Notes" defaultValue="Draft" /></CarouselItem><CarouselItem label="Sources" width={280}>Sources</CarouselItem></Carousel></>;
    }
    render(<Example />);
    const input = screen.getByRole("textbox", { name: "Notes" });
    fireEvent.change(input, { target: { value: "Edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Change alignment" }));
    expect(screen.getByRole("textbox", { name: "Notes" })).toBe(input);
    expect(input).toHaveValue("Edited");
    expect(screen.getByRole("region", { name: "Results" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("group", { name: "Sources" })).toHaveStyle({ flexBasis: "280px" });
  });
});
