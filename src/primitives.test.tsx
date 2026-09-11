import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { Avatar, Badge, Button, Checkbox, Disclosure, Field, IconButton, Input, Link, Progress, RadioGroup, Select, Separator, Slider, Switch, Textarea } from "./primitives";
import { KitProvider } from "./theme";

describe("boundaryless native controls", () => {
  test("link-styled actions keep native button activation rather than fake navigation", () => {
    const action = vi.fn();
    render(<Button variant="link" onClick={action}>Show details</Button>);
    const button = screen.getByRole("button", { name: "Show details" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("href");
    fireEvent.click(button);
    expect(action).toHaveBeenCalledOnce();
  });

  test("customizable select keeps native form, ref and disabled semantics", () => {
    const select = createRef<HTMLSelectElement>();
    const { container, rerender } = render(<form><Select ref={select} name="owner" aria-label="Owner" customizable defaultValue="alpha"><option value="alpha">Alpha</option><option value="beta" disabled>Beta</option></Select></form>);
    expect(select.current).toBe(screen.getByRole("combobox"));
    expect(select.current).toHaveClass("hk-select--customizable");
    expect(new FormData(container.querySelector("form")!).get("owner")).toBe("alpha");
    expect(container.querySelector("selectedcontent")).toBeInTheDocument();
    rerender(<Select aria-label="Owners" customizable multiple defaultValue={["alpha"]}><option value="alpha">Alpha</option></Select>);
    expect(screen.getByRole("listbox")).not.toHaveClass("hk-select--customizable");
    expect(container.querySelector("selectedcontent")).not.toBeInTheDocument();
  });

  test("slider formatted bubbles follow native values, controlled refusal and form reset", async () => {
    const change = vi.fn();
    const { container, rerender } = render(<form><Slider aria-label="Budget" name="budget" defaultValue={25} showValue formatValue={value => `$${value}`} onChange={change} /></form>);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "$25");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "40" } });
    expect(screen.getByText("$40")).toBeInTheDocument();
    expect(new FormData(container.querySelector("form")!).get("budget")).toBe("40");
    await act(async () => container.querySelector("form")!.reset());
    expect(screen.getByText("$25")).toBeInTheDocument();
    rerender(<Slider aria-label="Budget" value={10} showValue formatValue={value => `$${value}`} onChange={change} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "30" } });
    expect(screen.getByRole("slider")).toHaveValue("10");
    expect(screen.getByText("$10")).toBeInTheDocument();
    rerender(<Slider aria-label="Budget" value={10} disabled showValue={false} />);
    expect(screen.getByRole("slider")).toBeDisabled();
    expect(screen.queryByText("$10")).not.toBeInTheDocument();
  });
  test("link actions keep anchor navigation and icon slots out of the accessible name", () => {
    const activate = vi.fn(event => event.preventDefault());
    render(<Link href="/reports" variant="secondary" size="xs" leadingIcon="↗" trailingIcon="→" onClick={activate}>Reports</Link>);
    const link = screen.getByRole("link", { name: "Reports" });
    expect(link).toHaveAttribute("href", "/reports");
    expect(link).toHaveTextContent("↗Reports→");
    expect(link).toHaveClass("hk-link--secondary", "hk-link--xs");
    fireEvent.click(link);
    expect(activate).toHaveBeenCalledOnce();
  });
  test("avatars retain initials during image loading, failure and source replacement", () => {
    const { container, rerender } = render(<Avatar name="Alex Bennett" src="/first.png" size="xs" tone="blue" />);
    expect(screen.getByText("AB")).toBeVisible();
    expect(screen.getByRole("img", { name: "Alex Bennett" })).toHaveClass("hk-avatar--blue");
    expect(container.querySelector("img")).not.toBeVisible();
    fireEvent.load(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeVisible();
    expect(screen.queryByText("AB")).not.toBeInTheDocument();
    rerender(<Avatar name="Alex Bennett" src="/second.png" size="lg" />);
    expect(screen.getByText("AB")).toBeVisible();
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText("AB")).toBeVisible();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  test("button icon slots and compact variants retain native accessible actions", () => {
    const action = vi.fn();
    render(<><Button variant="secondary" size="xs" leadingIcon={<span>+</span>} trailingIcon={<span>→</span>} onClick={action}>Create</Button><Button variant="ghost" iconOnly aria-label="Search" leadingIcon={<span>⌕</span>} /><Badge tone="primary">2</Badge></>);
    const button = screen.getByRole("button", { name: "Create" });
    expect(button).toHaveClass("hk-button--secondary", "hk-button--xs");
    expect(button).toHaveTextContent("+Create→");
    fireEvent.click(button);
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Search" })).toHaveClass("hk-icon-button");
    expect(screen.getByText("2")).toHaveClass("hk-badge--primary");
  });

  test("divider content stays interactive outside separator semantics", () => {
    const action = vi.fn();
    const { rerender } = render(<Separator treatment="double" align="start"><Button onClick={action}>More</Button></Separator>);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    rerender(<Separator orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });
  test("typed host refs reach each native control and can focus it", () => {
    const button = createRef<HTMLButtonElement>();
    const input = createRef<HTMLInputElement>();
    const textarea = createRef<HTMLTextAreaElement>();
    const select = createRef<HTMLSelectElement>();
    const checkbox = createRef<HTMLInputElement>();
    const toggle = createRef<HTMLInputElement>();
    const slider = createRef<HTMLInputElement>();
    render(<><Button ref={button}>Continue</Button><Input ref={input} aria-label="Title" /><Textarea ref={textarea} aria-label="Description" /><Select ref={select} aria-label="Audience"><option>Team</option></Select><Checkbox ref={checkbox} label="Keep" /><Switch ref={toggle} label="Voice" /><Slider ref={slider} aria-label="Volume" /></>);
    expect([button, input, textarea, select, checkbox, toggle, slider].map(control => control.current?.tagName)).toEqual(["BUTTON", "INPUT", "TEXTAREA", "SELECT", "INPUT", "INPUT", "INPUT"]);
    input.current?.focus();
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus();
  });

  test("buttons default to non-submit and refuse disabled or pending actions", () => {
    const action = vi.fn();
    render(<><Button onClick={action}>Continue</Button><Button onClick={action} disabled>Unavailable</Button><Button onClick={action} pending>Saving</Button></>);
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("type", "button");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Unavailable" }));
    fireEvent.click(screen.getByRole("button", { name: "Saving" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
  });

  test("icon-only actions keep their accessible labels", () => {
    render(<IconButton label="Attach a file"><span aria-hidden="true">+</span></IconButton>);
    expect(screen.getByRole("button", { name: "Attach a file" })).toBeVisible();
  });

  test("fields associate unique labels, hints and errors without leaking between instances", () => {
    render(<><Field label="Project name" description="Visible to your team" error="Enter a name" required>{props => <Input {...props} />}</Field><Field label="Project name">{props => <Input {...props} />}</Field></>);
    const inputs = screen.getAllByRole("textbox", { name: "Project name" });
    expect(inputs[0].id).not.toBe(inputs[1].id);
    expect(inputs[0]).toHaveAccessibleDescription("Visible to your team Enter a name");
    expect(inputs[0]).toHaveAttribute("aria-invalid", "true");
    expect(inputs[0]).toBeRequired();
    expect(inputs[1]).not.toHaveAttribute("aria-describedby");
  });

  test("text controls preserve native forms, caller state and callbacks", () => {
    const update = vi.fn();
    render(<><Input aria-label="Title" value="Launch" onChange={update} name="title" /><Textarea aria-label="Description" defaultValue="A focused launch" /><Select aria-label="Audience" defaultValue="team"><option value="team">Our team</option><option value="public">Everyone</option></Select></>);
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Revised" } });
    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Launch");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("A focused launch");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "public" } });
    expect(screen.getByRole("combobox")).toHaveValue("public");
  });

  test("checkboxes and switches expose native state and disabled semantics", () => {
    const update = vi.fn();
    render(<><Checkbox label="Keep draft" checked onChange={update} /><Switch label="Voice" defaultChecked /><Switch label="Not available" disabled onChange={update} /></>);
    fireEvent.click(screen.getByRole("checkbox", { name: "Keep draft" }));
    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("switch", { name: "Voice" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Not available" })).toBeDisabled();
  });

  test("radio groups have separate form identities and preserve explicit selections", () => {
    const update = vi.fn();
    const options = [{ value: "team", label: "Our team" }, { value: "public", label: "Everyone", disabled: true }];
    render(<><RadioGroup label="Audience" value="team" options={options} onValueChange={update} /><RadioGroup label="Second audience" defaultValue="public" options={options} /></>);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
    expect(radios[1]).toBeDisabled();
    expect(radios[0].getAttribute("name")).not.toBe(radios[2].getAttribute("name"));
    expect(screen.getByRole("group", { name: "Audience" })).toBeVisible();
  });

  test("sliders use native bounds and progress does not invent a percentage", () => {
    render(<><Slider aria-label="Volume" min={0} max={10} defaultValue={4} /><Progress label="Uploading" /><Progress label="Reviewed" value={3} max={6} /></>);
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveValue("4");
    expect(screen.getByRole("progressbar", { name: "Uploading" })).not.toHaveAttribute("value");
    expect(screen.getByRole("progressbar", { name: "Reviewed" })).toHaveAttribute("value", "3");
    expect(screen.getByRole("progressbar", { name: "Reviewed" })).toHaveAttribute("max", "6");
  });

  test("disclosure delegates open state to native details and keeps content available", () => {
    render(<Disclosure summary="Evidence" open><p>Six sources reviewed</p></Disclosure>);
    expect(screen.getByText("Evidence").closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Six sources reviewed")).toBeVisible();
  });

  test("appearance and palette remain controlled and scoped to their provider", () => {
    const { container, rerender } = render(<KitProvider appearance="dark" palette="cozy"><Button>Inspect</Button></KitProvider>);
    expect(container.firstChild).toHaveAttribute("data-mode", "dark");
    expect(container.firstChild).toHaveAttribute("data-palette", "cozy");
    rerender(<KitProvider appearance="light"><Button>Inspect</Button></KitProvider>);
    expect(container.firstChild).toHaveAttribute("data-mode", "light");
    expect(container.firstChild).toHaveAttribute("data-palette", "clean");
    expect(document.documentElement).not.toHaveAttribute("data-mode");
  });

  test("system appearance follows live device changes", () => {
    let dark = false;
    let listener: (() => void) | undefined;
    vi.stubGlobal("matchMedia", () => ({ matches: dark, addEventListener: (_type: string, next: EventListener) => { listener = next as () => void; }, removeEventListener: () => undefined } as unknown as MediaQueryList));
    const { container } = render(<KitProvider appearance="system"><Button>Inspect</Button></KitProvider>);
    expect(container.firstChild).toHaveAttribute("data-mode", "light");
    dark = true;
    act(() => listener?.());
    expect(container.firstChild).toHaveAttribute("data-mode", "dark");
  });
});
