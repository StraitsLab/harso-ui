import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef, useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Announcement, Breadcrumb, BreadcrumbItem, ButtonGroup, Chip, CloseButton, Pagination, SegmentedControl, StatusDot, TabList, TabPanel, Tabs, ThemeToggle } from "./navigation";

const choices = [{ value: "team", label: "Our team" }, { value: "public", label: "Everyone" }, { value: "partners", label: "Partners", disabled: true }];

describe("compact navigation and selection", () => {
  test("segmented thumb follows native selection, reset and host refusal without another selection store", async () => {
    const left = vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) { return this.querySelector('input[value="public"]') ? 100 : 0; });
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(90);
    const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(44);
    try {
      const ref = createRef<HTMLFieldSetElement>();
      const { container, rerender } = render(<form><SegmentedControl ref={ref} label="Audience" items={choices} defaultValue="team" /></form>);
      const group = screen.getByRole("group");
      expect(ref.current).toBe(group);
      expect(group.style.getPropertyValue("--hk-thumb-x")).toBe("0px");
      await act(async () => fireEvent.click(screen.getByRole("radio", { name: "Everyone" })));
      expect(group.style.getPropertyValue("--hk-thumb-x")).toBe("100px");
      await act(async () => container.querySelector("form")!.reset());
      expect(group.style.getPropertyValue("--hk-thumb-x")).toBe("0px");
      rerender(<form><SegmentedControl label="Audience" items={choices} value="team" onValueChange={() => undefined} /></form>);
      await act(async () => fireEvent.click(screen.getByRole("radio", { name: "Everyone" })));
      expect(group.style.getPropertyValue("--hk-thumb-x")).toBe("0px");
      rerender(<form><SegmentedControl label="Audience" items={[]} value="team" /></form>);
      expect(group).not.toHaveAttribute("data-thumb");
    } finally { left.mockRestore(); width.mockRestore(); height.mockRestore(); }
  });

  test("segmented native keyboard skips disabled options and Space selects without stealing focus", async () => {
    const user = userEvent.setup();
    render(<SegmentedControl label="Audience" name="audience" items={choices} defaultValue="team" />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "Our team" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Everyone" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Everyone" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Our team" })).toBeChecked();
    screen.getByRole("radio", { name: "Everyone" }).focus();
    await user.keyboard(" ");
    expect(screen.getByRole("radio", { name: "Everyone" })).toBeChecked();
  });

  test("theme reveal requests host state once and uses interaction origin without persistence", async () => {
    const animate = vi.fn();
    const start = vi.fn(({ update }: { update: () => void }) => { update(); return { ready: Promise.resolve(), finished: Promise.resolve(), skipTransition: vi.fn() }; });
    const storage = vi.spyOn(Storage.prototype, "setItem");
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    Object.defineProperty(document, "startViewTransition", { configurable: true, value: start });
    Object.defineProperty(document.documentElement, "animate", { configurable: true, value: animate });
    function Host() { const [value, setValue] = useState<"light" | "dark" | "system">("system"); return <ThemeToggle value={value} onValueChange={setValue} compact />; }
    try {
      render(<Host />);
      await act(async () => fireEvent.click(screen.getByRole("button"), { detail: 1, clientX: 24, clientY: 32 }));
      expect(start).toHaveBeenCalledOnce();
      expect(screen.getByRole("button")).toHaveAccessibleName("Change appearance, currently light");
      expect(animate).toHaveBeenCalledWith(expect.objectContaining({ clipPath: expect.arrayContaining(["circle(0px at 24px 32px)"]) }), expect.objectContaining({ pseudoElement: "::view-transition-new(root)" }));
      expect(storage).not.toHaveBeenCalled();
    } finally { delete (document as Partial<Document>).startViewTransition; delete (document.documentElement as Partial<HTMLElement>).animate; vi.unstubAllGlobals(); storage.mockRestore(); }
  });

  test.each(["reduced motion", "unsupported", "rejected start"])("theme uses immediate host-only fallback for %s", async mode => {
    const change = vi.fn();
    const start = vi.fn(() => { throw new Error("Transition unavailable"); });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: mode === "reduced motion" })));
    Object.defineProperty(document, "startViewTransition", { configurable: true, value: mode === "unsupported" ? undefined : start });
    Object.defineProperty(document.documentElement, "animate", { configurable: true, value: vi.fn() });
    try {
      const { rerender } = render(<ThemeToggle value="system" onValueChange={change} compact />);
      await act(async () => fireEvent.click(screen.getByRole("button")));
      expect(change).toHaveBeenCalledExactlyOnceWith("light");
      expect(screen.getByRole("button")).toHaveAccessibleName("Change appearance, currently system");
      if (mode !== "rejected start") expect(start).not.toHaveBeenCalled();
      rerender(<ThemeToggle value="system" onValueChange={change} compact disabled />);
      fireEvent.click(screen.getByRole("button"));
      expect(change).toHaveBeenCalledOnce();
    } finally { delete (document as Partial<Document>).startViewTransition; delete (document.documentElement as Partial<HTMLElement>).animate; vi.unstubAllGlobals(); }
  });

  test("theme skips reveal when the host refuses and does not request a second change", async () => {
    const change = vi.fn();
    const skip = vi.fn();
    const animate = vi.fn();
    const start = vi.fn(({ update }: { update: () => void }) => { update(); return { ready: Promise.resolve(), finished: Promise.resolve(), skipTransition: skip }; });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    Object.defineProperty(document, "startViewTransition", { configurable: true, value: start });
    Object.defineProperty(document.documentElement, "animate", { configurable: true, value: animate });
    try {
      render(<ThemeToggle value="system" onValueChange={change} />);
      await act(async () => fireEvent.click(screen.getByRole("radio", { name: "Dark" })));
      expect(change).toHaveBeenCalledExactlyOnceWith("dark");
      expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
      expect(skip).toHaveBeenCalledOnce();
      expect(animate).not.toHaveBeenCalled();
    } finally { delete (document as Partial<Document>).startViewTransition; delete (document.documentElement as Partial<HTMLElement>).animate; vi.unstubAllGlobals(); }
  });
  test("chip color and emphasis choices retain readable text and inert status dots", () => {
    const colors = ["lime", "rose", "yellow", "cyan", "neutral", "gray", "soft", "green", "indigo"] as const;
    const { container } = render(<>{colors.map(tone => <Chip key={tone} tone={tone} variant="bold"><StatusDot tone={tone} />{tone}</Chip>)}<Chip variant="subtle">Subtle</Chip><Chip variant="caption">Caption</Chip></>);
    for (const tone of colors) expect(screen.getByText(tone)).toHaveClass(`hk-tone--${tone}`, "hk-chip--bold");
    expect(container.querySelectorAll('.hk-status-dot[aria-hidden="true"]')).toHaveLength(colors.length);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("announcement CTA and dismissal request host changes without hiding refused state", () => {
    const action = vi.fn();
    const dismiss = vi.fn();
    const { rerender } = render(<Announcement title="Update" actionLabel="Read update" onAction={action} onDismiss={dismiss} open />);
    fireEvent.click(screen.getByRole("button", { name: "Read update" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Update" }));
    expect(action).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledOnce();
    expect(screen.getByText("Update")).toBeVisible();
    rerender(<Announcement title="Update" actionLabel="Read update" open={false} />);
    expect(screen.getByText("Update")).not.toBeVisible();
    expect(screen.getByText("Update").closest("section")).toHaveAttribute("inert");
    expect(screen.getByText("Update").closest("section")).toHaveAttribute("aria-hidden", "true");
    rerender(<Announcement title="Update" actionLabel="Read update" />);
    expect(screen.getByRole("button", { name: "Read update" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Dismiss Update" })).not.toBeInTheDocument();
  });
  test("breadcrumbs navigate ancestors but never the current location", () => {
    render(<Breadcrumb><BreadcrumbItem href="/projects">Projects</BreadcrumbItem><BreadcrumbItem current href="/launch">Launch</BreadcrumbItem></Breadcrumb>);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    expect(screen.queryByRole("link", { name: "Launch" })).toBeNull();
    expect(screen.getByText("Launch")).toHaveAttribute("aria-current", "page");
  });

  test("single and multiple selection submit native form values and reset", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<form><SegmentedControl label="Audience" name="audience" items={choices} defaultValue="team" onValueChange={onValueChange} /><ButtonGroup label="Channels" name="channels" items={choices} multiple defaultSelected={["team"]} /><button type="reset">Reset</button></form>);
    await user.click(screen.getByRole("radio", { name: "Everyone" }));
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }));
    await user.click(screen.getByRole("radio", { name: "Partners" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("public");
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("audience")).toBe("public");
    expect(new FormData(form).getAll("channels")).toEqual(["team", "public"]);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(new FormData(form).get("audience")).toBe("team");
    expect(new FormData(form).getAll("channels")).toEqual(["team"]);
  });

  test("controlled selection reports intent without replacing the host value", () => {
    const change = vi.fn();
    render(<SegmentedControl label="Audience" items={choices} value="team" onValueChange={change} />);
    fireEvent.click(screen.getByRole("radio", { name: "Everyone" }));
    expect(change).toHaveBeenCalledExactlyOnceWith("public");
    expect(screen.getByRole("radio", { name: "Our team" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Everyone" })).not.toBeChecked();
  });

  test("controlled forms can retain host values by explicitly owning reset", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    const form = (selected: string[]) => <form onReset={event => event.preventDefault()}><ButtonGroup label="Channels" name="channels" multiple selected={selected} items={choices} onSelectionChange={update} /><button type="reset">Keep current selection</button></form>;
    const { container, rerender } = render(form(["team"]));
    rerender(form(["public"]));
    await user.click(screen.getByRole("button", { name: "Keep current selection" }));
    expect(new FormData(container.querySelector("form")!).getAll("channels")).toEqual(["public"]);
    expect(screen.getByRole("checkbox", { name: "Everyone" })).toBeChecked();
    expect(update).not.toHaveBeenCalled();
  });

  test("tabs skip disabled entries, own unique relations and retain hidden drafts", () => {
    const items = [{ value: "overview", label: "Overview", content: <input aria-label="Draft" defaultValue="Keep me" /> }, { value: "blocked", label: "Unavailable", disabled: true, content: "No access" }, { value: "sources", label: "Sources", content: "Six sources" }];
    render(<><Tabs label="Work" items={items} /><Tabs label="Other work" items={items} variant="pill" /></>);
    const first = screen.getByRole("tablist", { name: "Work" });
    const overview = within(first).getByRole("tab", { name: "Overview" });
    const sources = within(first).getByRole("tab", { name: "Sources" });
    expect(overview.id).not.toBe(within(screen.getByRole("tablist", { name: "Other work" })).getByRole("tab", { name: "Overview" }).id);
    fireEvent.change(screen.getAllByRole("textbox", { name: "Draft" })[0], { target: { value: "My changes" } });
    fireEvent.keyDown(overview, { key: "ArrowRight" });
    expect(sources).toHaveFocus();
    expect(sources).toHaveAttribute("aria-selected", "true");
    expect(document.getElementById(sources.getAttribute("aria-controls")!)).toHaveTextContent("Six sources");
    fireEvent.keyDown(sources, { key: "Home" });
    expect(overview).toHaveFocus();
    expect(screen.getAllByRole("textbox", { name: "Draft" })[0]).toHaveValue("My changes");
  });

  test("pagination is bounded even for large, invalid and single-page inputs", () => {
    const change = vi.fn();
    const { rerender } = render(<Pagination page={500000} pageCount={1000000} onPageChange={change} />);
    expect(screen.getAllByRole("button").length).toBeLessThanOrEqual(9);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(change).toHaveBeenCalledExactlyOnceWith(500001);
    rerender(<Pagination page={1} pageCount={1} onPageChange={change} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    rerender(<Pagination page={NaN} pageCount={Infinity} onPageChange={change} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("No pages")).toBeVisible();
  });

  test("a directly composed TabList has an enabled keyboard entry without a value", () => {
    const update = vi.fn();
    const items = [{ value: "blocked", label: "Unavailable", content: null, disabled: true }, { value: "first", label: "First", content: "First content" }, { value: "second", label: "Second", content: "Second content" }];
    render(<><TabList label="Composed tabs" identity="composed" items={items} onValueChange={update} /><TabPanel active tabId="composed-tab-first" id="composed-panel-first">First content</TabPanel><TabPanel active={false} tabId="composed-tab-second" id="composed-panel-second">Second content</TabPanel></>);
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(screen.getByRole("tab", { name: "First" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
    expect(update).toHaveBeenCalledExactlyOnceWith("second");
  });

  test("announcement visibility and theme remain owned by the host", () => {
    const dismiss = vi.fn();
    const action = vi.fn();
    const change = vi.fn();
    render(<><Announcement title="Your next chapter" description="A sample announcement" action={<button onClick={action}>Explore</button>} onDismiss={dismiss} /><ThemeToggle value="system" onValueChange={change} /></>);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Your next chapter" }));
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Your next chapter")).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(change).toHaveBeenCalledExactlyOnceWith("dark");
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });

  test("status text and compact close controls remain accessible", () => {
    const close = vi.fn();
    render(<><Chip tone="positive"><StatusDot tone="positive" />Ready</Chip><CloseButton label="Close work details" onClick={close} /><CloseButton label="Unavailable close" disabled onClick={close} /></>);
    expect(screen.getByText("Ready")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close work details" }));
    fireEvent.click(screen.getByRole("button", { name: "Unavailable close" }));
    expect(close).toHaveBeenCalledTimes(1);
  });
});
