import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { AiChatComposerPreview, Announcement, Avatar, Badge, Breadcrumb, BreadcrumbItem, Button, ButtonGroup, Checkbox, CheckboxCard, Chip, CloseButton, Composer, ComposerLoader, DataTable, Field, GlassComposer, IconButton, Input, InputOtp, Kbd, Link, Notification, NotificationAction, NotificationCenter, NotificationViewport, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, RadioCard, Separator, Sidebar, SidebarItem, StatCards, StatusBar, StatusDot, Switch, SwitchCard, Tabs } from "./index";

const avatarCases = ([["xs", 24], ["sm", 28], ["md", 36], ["lg", 48]] as const).flatMap(([size, pixels]) =>
  (["neutral", "blue"] as const).map(tone => ({ size, pixels, tone })));
const buttonCases = (["primary", "secondary", "ghost", "danger"] as const).flatMap(variant =>
  (["medium", "small", "xs"] as const).map(size => ({ variant, size })));
const dividerCases = (["single", "double", "fill"] as const).flatMap(treatment =>
  (["start", "center", "end"] as const).map(align => ({ treatment, align })));
const switchCases = (["pill", "rectangle"] as const).flatMap(shape =>
  (["large", "medium", "small"] as const).map(controlSize => ({ shape, controlSize })));

describe("WEV-1492 foundation equivalent contracts", () => {
  test("FND-AVATAR-RECONFIGURE host changes size and tint without replacing the labelled root", () => {
    const { rerender } = render(<Avatar name="Alex Bennett" size="xs" tone="neutral" />);
    const avatar = screen.getByRole("img", { name: "Alex Bennett" });
    expect(avatar.style.getPropertyValue("--hk-avatar-size")).toBe("24px");
    expect(avatar).toHaveClass("hk-avatar--neutral");
    rerender(<Avatar name="Morgan Lee" size="lg" tone="blue" />);
    expect(screen.getByRole("img", { name: "Morgan Lee" })).toBe(avatar);
    expect(avatar.style.getPropertyValue("--hk-avatar-size")).toBe("48px");
    expect(avatar).toHaveClass("hk-avatar--blue");
    expect(avatar).toHaveTextContent("ML");
  });

  test.each(avatarCases)("FND-AVATAR $size/$tone retains labelled fallback through image lifecycle", ({ size, pixels, tone }) => {
    const { container, rerender } = render(<Avatar name="Alex Bennett" size={size} tone={tone} src="/first.png" />);
    const avatar = screen.getByRole("img", { name: "Alex Bennett" });
    expect(avatar).toHaveClass(`hk-avatar--${tone}`);
    expect(avatar.style.getPropertyValue("--hk-avatar-size")).toBe(`${pixels}px`);
    expect(avatar).toHaveTextContent("AB");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("img")).toHaveAttribute("hidden");
    fireEvent.load(container.querySelector("img")!);
    expect(container.querySelector("img")).not.toHaveAttribute("hidden");
    expect(avatar).not.toHaveTextContent("AB");
    rerender(<Avatar name="Alex Bennett" size={size} tone={tone} src="/replacement.png" />);
    expect(screen.getByRole("img", { name: "Alex Bennett" })).toBe(avatar);
    expect(avatar).toHaveTextContent("AB");
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(avatar).toHaveTextContent("AB");
    rerender(<Avatar name="Morgan Lee" size={size} tone={tone === "blue" ? "neutral" : "blue"} />);
    expect(screen.getByRole("img", { name: "Morgan Lee" })).toHaveTextContent("ML");
    expect(avatar).toHaveClass(`hk-avatar--${tone === "blue" ? "neutral" : "blue"}`);
  });

  test.each(buttonCases)("FND-BUTTON $variant/$size preserves slots, native activation and disabled/pending guards", async ({ variant, size }) => {
    const user = userEvent.setup();
    const action = vi.fn();
    const submit = vi.fn(event => event.preventDefault());
    const ref = createRef<HTMLButtonElement>();
    const { rerender } = render(<form onSubmit={submit}><Button ref={ref} variant={variant} size={size} leadingIcon="+" trailingIcon="→" onClick={action}>Create</Button></form>);
    const button = screen.getByRole("button", { name: "Create" });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass(`hk-button--${variant}`, `hk-button--${size}`);
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveTextContent("+Create→");
    expect(button.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    await user.click(button);
    await user.keyboard("{Enter} ");
    expect(action).toHaveBeenCalledTimes(3);
    expect(submit).not.toHaveBeenCalled();
    rerender(<Button variant={variant} size={size} disabled onClick={action}>Create</Button>);
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Create" }));
    rerender(<Button variant={variant} size={size} pending onClick={action}>Create</Button>);
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute("aria-busy", "true");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(action).toHaveBeenCalledTimes(3);
  });

  test.each(["medium", "small"] as const)("FND-ICON %s retains its name, decorative slot and native guards", async size => {
    const user = userEvent.setup();
    const action = vi.fn();
    const { rerender } = render(<IconButton label="Attach reference" size={size} onClick={action}><svg aria-hidden="true" data-testid="attachment-icon" /></IconButton>);
    const button = screen.getByRole("button", { name: "Attach reference" });
    expect(button).toHaveClass("hk-icon-button", `hk-button--${size}`);
    expect(within(button).getByTestId("attachment-icon")).toHaveAttribute("aria-hidden", "true");
    await user.click(button);
    await user.keyboard("{Enter}");
    expect(action).toHaveBeenCalledTimes(2);
    rerender(<IconButton label="Attach reference" size={size} disabled onClick={action} />);
    await user.click(screen.getByRole("button", { name: "Attach reference" }));
    expect(action).toHaveBeenCalledTimes(2);
  });

  test.each((["primary", "secondary"] as const).flatMap(variant => (["medium", "small", "xs"] as const).map(size => ({ variant, size }))))("FND-LINK $variant/$size keeps navigation and decorative slots", async ({ variant, size }) => {
    const user = userEvent.setup();
    const action = vi.fn(event => event.preventDefault());
    render(<Link href="/evidence" variant={variant} size={size} leadingIcon="↗" trailingIcon="→" onClick={action}>Evidence</Link>);
    const link = screen.getByRole("link", { name: "Evidence" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/evidence");
    expect(link).toHaveClass(`hk-link--${variant}`, `hk-link--${size}`);
    expect(link).toHaveTextContent("↗Evidence→");
    expect(link.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.queryByRole("button")).toBeNull();
    await user.click(link);
    await user.keyboard("{Enter}");
    expect(action).toHaveBeenCalledTimes(2);
    expect(action.mock.calls.every(([event]) => event.defaultPrevented)).toBe(true);
  });

  test.each(["neutral", "primary", "positive", "attention", "negative", "active"] as const)("FND-BADGE %s and Kbd display host content without adding focus targets", async tone => {
    const user = userEvent.setup();
    const { container, rerender } = render(<><Button>Before</Button><Badge tone={tone}>3</Badge><Kbd>⌘ K</Kbd><Button>After</Button></>);
    const badge = screen.getByText("3");
    const shortcut = screen.getByText("⌘ K");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass(`hk-badge--${tone}`);
    expect(shortcut.tagName).toBe("KBD");
    for (const element of [badge, shortcut]) {
      expect(element).not.toHaveAttribute("tabindex");
      expect(element).not.toHaveAttribute("role");
      expect(element.tabIndex).toBe(-1);
    }
    expect(screen.getAllByRole("button")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.click(badge);
    await user.keyboard("k");
    expect(badge).toHaveTextContent("3");
    expect(shortcut).toHaveTextContent("⌘ K");
    expect(container.querySelectorAll('input, [aria-pressed], [aria-selected]')).toHaveLength(0);
    rerender(<><Badge tone={tone}>0</Badge><Kbd>Esc</Kbd></>);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Esc").tagName).toBe("KBD");
  });

  test.each(dividerCases)("FND-DIVIDER $treatment/$align preserves composed content and native actions", async ({ treatment, align }) => {
    const user = userEvent.setup();
    const action = vi.fn();
    const select = vi.fn();
    const { container, rerender } = render(<Separator treatment={treatment} align={align}><span>Section</span><svg role="img" aria-label="Section icon" /><Chip>Ready</Chip><Button onClick={action}>More</Button><Avatar name="Alex Bennett" /><ButtonGroup label="Export format" items={[{ value: "pdf", label: "PDF" }, { value: "text", label: "Text" }]} defaultSelected={["pdf"]} onSelectionChange={select} /></Separator>);
    const divider = container.firstElementChild;
    expect(divider).toHaveAttribute("data-treatment", treatment);
    expect(divider).toHaveAttribute("data-align", align);
    expect(divider).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Section icon" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Alex Bennett" })).toHaveTextContent("AB");
    expect(screen.getByText("Ready")).toHaveClass("hk-chip");
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(action).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("radio", { name: "Text" }));
    expect(select).toHaveBeenCalledWith(["text"]);
    expect(screen.getByRole("radio", { name: "Text" })).toBeChecked();
    rerender(<Separator treatment={treatment} align={align} orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
    expect(screen.getByRole("separator")).toHaveAttribute("data-treatment", treatment);
    expect(screen.getByRole("separator")).toHaveAttribute("data-align", align);
    expect(screen.queryByRole("button")).toBeNull();
  });

  test.each(["icon", "avatar"] as const)("FND-BREADCRUMB %s slots preserve ancestor links and a non-link current page", async slot => {
    const user = userEvent.setup();
    const navigate = vi.fn(event => event.preventDefault());
    const leading = slot === "icon" ? <svg aria-hidden="true" data-testid="crumb-icon" /> : <Avatar name="Alex Bennett" />;
    render(<Breadcrumb label="Work location"><BreadcrumbItem href="/projects" onClick={navigate}>{leading}Projects</BreadcrumbItem><BreadcrumbItem current href="/current">Current work</BreadcrumbItem></Breadcrumb>);
    const navigation = screen.getByRole("navigation", { name: "Work location" });
    const ancestor = within(navigation).getByRole("link");
    expect(ancestor).toHaveTextContent("Projects");
    expect(ancestor).toHaveAttribute("href", "/projects");
    if (slot === "icon") {
      expect(within(ancestor).getByTestId("crumb-icon")).toHaveAttribute("aria-hidden", "true");
      expect(ancestor.firstElementChild).toBe(within(ancestor).getByTestId("crumb-icon"));
    } else {
      expect(within(ancestor).getByRole("img", { name: "Alex Bennett" })).toHaveTextContent("AB");
      expect(ancestor.firstElementChild).toBe(within(ancestor).getByRole("img", { name: "Alex Bennett" }));
    }
    expect(within(navigation).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Current work")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Current work")).not.toHaveAttribute("href");
    await user.click(ancestor);
    await user.click(screen.getByText("Current work"));
    expect(navigate).toHaveBeenCalledOnce();
  });

  test.each(["2xs", "xs", "small", "medium"] as const)("FND-CLOSE %s composes a dialog header and keeps a decorative glyph", async size => {
    const user = userEvent.setup();
    const close = vi.fn();
    const { rerender } = render(<section role="dialog" aria-label="Work details"><header><h2>Work details</h2><CloseButton label="Close work details" size={size} onClick={close} /></header></section>);
    const button = within(screen.getByRole("dialog")).getByRole("button", { name: "Close work details" });
    expect(button).toHaveClass(`hk-close--${size}`, `hk-button--${size === "medium" ? "medium" : "small"}`);
    expect(button.closest("header")).not.toBeNull();
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(button.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
    expect(button.querySelector("path")).toHaveAttribute("d", "m6 6 12 12M18 6 6 18");
    await user.click(button);
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    rerender(<CloseButton label="Close work details" size={size} disabled onClick={close} />);
    await user.click(screen.getByRole("button", { name: "Close work details" }));
    expect(close).toHaveBeenCalledOnce();
  });

  test("FND-INPUT-DEFAULT native editing and disabled omission retain form semantics", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<form><Input name="project" aria-label="Project" defaultValue="Initial" /></form>);
    const input = screen.getByRole("textbox", { name: "Project" });
    expect(input).toBeEnabled();
    expect(input).not.toBeRequired();
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(container.querySelectorAll(".hk-input-adornment")).toHaveLength(0);
    await user.clear(input);
    await user.type(input, "Edited");
    expect(new FormData(container.querySelector("form")!).get("project")).toBe("Edited");
    rerender(<form><Input name="project" aria-label="Project" defaultValue="Initial" disabled /></form>);
    expect(screen.getByRole("textbox", { name: "Project" })).toBeDisabled();
    expect(new FormData(container.querySelector("form")!).has("project")).toBe(false);
    await user.type(screen.getByRole("textbox", { name: "Project" }), "ignored");
    expect(screen.getByRole("textbox", { name: "Project" })).toHaveValue("Edited");
  });

  test.each(["none", "leading", "trailing"] as const)("FND-INPUT %s slot retains required/hint/error semantics and host refusal", async slot => {
    const user = userEvent.setup();
    const change = vi.fn();
    const ref = createRef<HTMLInputElement>();
    const { rerender } = render(<form><Field label="Project" description="Choose a name" error="Already used" required>{props => <Input {...props} ref={ref} name="project" value="Host value" onChange={change} leading={slot === "leading" ? <span data-testid="leading">Prefix</span> : undefined} trailing={slot === "trailing" ? <span data-testid="trailing">Suffix</span> : undefined} />}</Field></form>);
    const input = screen.getByRole("textbox", { name: "Project" });
    expect(ref.current).toBe(input);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Choose a name Already used");
    expect(input).toHaveValue("Host value");
    expect(screen.queryByTestId("leading") !== null).toBe(slot === "leading");
    expect(screen.queryByTestId("trailing") !== null).toBe(slot === "trailing");
    if (slot === "leading") expect(input.previousElementSibling).toContainElement(screen.getByTestId("leading"));
    if (slot === "trailing") expect(input.nextElementSibling).toContainElement(screen.getByTestId("trailing"));
    await user.click(input);
    expect(input).toHaveFocus();
    await user.type(input, "!");
    expect(change).toHaveBeenCalledOnce();
    expect(input).toHaveValue("Host value");
    expect(new FormData(input.closest("form")!).get("project")).toBe("Host value");
    rerender(<Input aria-label="Project" value="Replacement" onChange={change} disabled />);
    expect(screen.getByRole("textbox", { name: "Project" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Project" }), "ignored");
    expect(change).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", { name: "Project" })).toHaveValue("Replacement");
  });

  test.each((["medium", "small"] as const).flatMap(controlSize => [false, true].map(checked => ({ controlSize, checked }))))("FND-CHECKBOX $controlSize/$checked retains card labels and controlled state", async ({ controlSize, checked }) => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(<CheckboxCard label="Keep references" description="Supplied sources" controlSize={controlSize} checked={checked} onChange={change} />);
    const checkbox = screen.getByRole("checkbox", { name: "Keep references" });
    expect(checkbox).toHaveAccessibleDescription("Supplied sources");
    expect(checkbox.closest("label")).toHaveClass("hk-choice-card", `hk-choice--${controlSize}`);
    expect((checkbox as HTMLInputElement).checked).toBe(checked);
    await user.click(screen.getByText("Keep references"));
    expect(change).toHaveBeenCalledOnce();
    expect((checkbox as HTMLInputElement).checked).toBe(checked);
    rerender(<Checkbox label="Keep references" controlSize={controlSize} checked={!checked} disabled onChange={change} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(!checked);
    await user.click(screen.getByText("Keep references"));
    expect(change).toHaveBeenCalledOnce();
  });

  test.each(switchCases)("FND-SWITCH $shape/$controlSize retains card and native switch label behavior", async ({ shape, controlSize }) => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(<SwitchCard label="Voice responses" description="Read replies" shape={shape} controlSize={controlSize} checked={false} onChange={change} />);
    const toggle = screen.getByRole("switch", { name: "Voice responses" });
    expect(toggle).toHaveAccessibleDescription("Read replies");
    expect(toggle.closest("label")).toHaveClass("hk-choice-card", `hk-switch--${shape}`, `hk-choice--${controlSize}`);
    await user.click(screen.getByText("Voice responses"));
    expect(change).toHaveBeenCalledOnce();
    expect(toggle).not.toBeChecked();
    rerender(<Switch label="Voice responses" shape={shape} controlSize={controlSize} checked disabled onChange={change} />);
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("switch")).toBeDisabled();
    await user.click(screen.getByText("Voice responses"));
    expect(change).toHaveBeenCalledOnce();
  });
});

describe("WEV-1492 foundation second packet", () => {
  test.each((["bold", "subtle", "caption"] as const).flatMap(variant => (["lime", "rose", "yellow", "cyan", "neutral", "gray", "soft", "green", "indigo"] as const).map(tone => ({ variant, tone }))))("FND2-CHIP $variant/$tone preserves supplied status and decorative dot", async ({ variant, tone }) => {
    const user = userEvent.setup();
    const { rerender } = render(<><Button>Before</Button><Chip variant={variant} tone={tone}><StatusDot tone={tone} />Ready</Chip><Button>After</Button></>);
    const chip = screen.getByText("Ready");
    expect(chip).toHaveClass(`hk-chip--${variant}`, `hk-tone--${tone}`);
    expect(chip.tagName).toBe("SPAN");
    expect(chip.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(chip.firstElementChild).toHaveClass("hk-status-dot", `hk-tone--${tone}`);
    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    rerender(<Chip variant={variant === "caption" ? "bold" : "caption"} tone={tone === "neutral" ? "green" : "neutral"}>Changed by host</Chip>);
    expect(screen.queryByText("Ready")).toBeNull();
    expect(screen.getByText("Changed by host")).toHaveClass(`hk-chip--${variant === "caption" ? "bold" : "caption"}`, `hk-tone--${tone === "neutral" ? "green" : "neutral"}`);
    expect(screen.queryByRole("button")).toBeNull();
  });

  test.each((["information", "success", "error"] as const).flatMap(tone => (["online", "busy", "offline"] as const).flatMap(presence => (["icon", "avatar"] as const).map(visual => ({ tone, presence, visual })))))("FND2-NOTIFICATION $tone/$presence/$visual retains supplied content and host dismissal", async ({ tone, presence, visual }) => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    const { container, rerender } = render(<Notification title="Saved report" description="The host supplied this result" tone={tone} presence={presence} icon={visual === "icon" ? <svg data-testid="notice-icon" aria-hidden="true" /> : undefined} avatar={visual === "avatar" ? <Avatar name="Alex Bennett" /> : undefined} onDismiss={dismiss} />);
    const notice = screen.getByRole("status");
    expect(notice).toHaveAttribute("data-tone", tone);
    expect(within(notice).getByRole("heading", { name: "Saved report" })).toBeInTheDocument();
    expect(within(notice).getByText("The host supplied this result")).toBeInTheDocument();
    expect(notice.querySelector("[data-presence]")).toHaveAttribute("data-presence", presence);
    expect(notice.querySelector("[data-presence]")).toHaveTextContent({ online: "Online", busy: "Busy", offline: "Offline" }[presence]);
    if (visual === "icon") expect(within(notice).getByTestId("notice-icon").parentElement).toHaveClass("hk-notification-visual");
    else expect(notice.querySelector('.hk-notification-visual [role="img"]')).toHaveAttribute("aria-label", "Alex Bennett");
    await user.click(within(notice).getByRole("button", { name: "Dismiss notification" }));
    expect(dismiss).toHaveBeenCalledOnce();
    expect(notice).not.toHaveAttribute("hidden");
    rerender(<Notification title="Saved report" tone={tone} open={false} />);
    expect(container.querySelector(".hk-notification")).toBe(notice);
    expect(notice).toHaveAttribute("hidden");
    expect(notice).toHaveAttribute("inert");
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<Notification title="Updated report" tone={tone} />);
    expect(screen.getByRole("status")).toHaveTextContent("Updated report");
    expect(notice.querySelector("[data-presence]")).toBeNull();
  });

  test.each(["primary", "secondary", "danger"] as const)("FND2-NOTICE-ACTION %s preserves action slots and disabled guards", async variant => {
    const user = userEvent.setup();
    const action = vi.fn();
    const { rerender } = render(<Notification title="Action requested"><NotificationAction variant={variant} onClick={action}>Review</NotificationAction></Notification>);
    const button = within(screen.getByRole("status")).getByRole("button", { name: "Review" });
    expect(button).toHaveClass("hk-notification-action", `hk-button--${variant}`);
    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    await user.keyboard("{Enter}");
    expect(action).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent("Action requested");
    rerender(<Notification title="Action requested"><NotificationAction variant={variant} disabled onClick={action}>Review</NotificationAction></Notification>);
    await user.click(screen.getByRole("button", { name: "Review" }));
    expect(action).toHaveBeenCalledTimes(2);
  });

  test.each(["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] as const)("FND2-NOTICE-POSITION %s keeps labelled ordered notifications and host updates", async position => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    const { container, rerender } = render(<NotificationViewport position={position} label="Host notifications"><Notification title="First" onDismiss={dismiss} /><Notification title="Second" /></NotificationViewport>);
    const viewport = container.firstElementChild;
    expect(viewport).toHaveAttribute("aria-label", "Host notifications");
    expect(viewport).toHaveClass(`hk-notification-viewport--${position}`);
    expect(screen.getAllByRole("heading").map(heading => heading.textContent)).toEqual(["First", "Second"]);
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(dismiss).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("status")).toHaveLength(2);
    rerender(<NotificationViewport position={position} label="Host notifications"><Notification title="Second" /></NotificationViewport>);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("heading")).toHaveTextContent("Second");
  });

  test.each(["avatar", "icon"] as const)("FND2-NOTICE-CENTER %s item slots retain exact host selection and unread state", async visual => {
    const user = userEvent.setup();
    const select = vi.fn();
    const read = vi.fn();
    const item = { id: "notice", title: "Review complete", description: "Supplied details", avatar: visual === "avatar" ? <Avatar name="Alex Bennett" /> : undefined, icon: visual === "icon" ? <StatusDot tone="positive" data-testid="semantic-status" /> : undefined };
    render(<NotificationCenter items={[item]} onSelect={select} onMarkRead={read} />);
    const button = screen.getByRole("button", { name: /Review complete/ });
    expect(button).toHaveTextContent("Supplied details");
    if (visual === "avatar") expect(button.querySelector('[role="img"]')).toHaveAttribute("aria-label", "Alex Bennett");
    else expect(within(button).getByTestId("semantic-status")).toHaveClass("hk-tone--positive");
    await user.click(button);
    expect(select).toHaveBeenCalledExactlyOnceWith(item);
    expect(read).toHaveBeenCalledExactlyOnceWith("notice");
    expect(within(button).getByLabelText("Unread")).toBeInTheDocument();
  });

  test.each((["plain", "footer"] as const).flatMap(variant => (["blue", "orange", "purple", "pink", "sky", "emerald"] as const).map(tone => ({ variant, tone }))))("FND2-STATS $variant/$tone retains labelled values, trends and captions", ({ variant, tone }) => {
    const { container, rerender } = render(<StatCards label="Supplied metrics" variant={variant} items={[{ id: "sources", label: "Sources", value: "0", delta: "+3", trend: "positive", caption: "Host count", tone }]} />);
    const list = container.querySelector("dl");
    expect(list).toHaveAttribute("aria-label", "Supplied metrics");
    expect(list).toHaveAttribute("data-variant", variant);
    expect(container.querySelector("dt")).toHaveTextContent("Sources");
    expect(container.querySelector("dd .hk-stat-value")).toHaveTextContent("0");
    expect(container.querySelector("[data-tone]")).toHaveAttribute("data-tone", tone);
    expect(container.querySelector("[data-trend]")).toHaveAttribute("data-trend", "positive");
    expect(container.querySelector("dd")).toHaveTextContent("+3Host count");
    rerender(<StatCards label="Supplied metrics" variant={variant} items={[{ id: "sources", label: "Sources", value: "7", tone }]} />);
    expect(container.querySelector("dl")).toBe(list);
    expect(container.querySelector(".hk-stat-value")).toHaveTextContent("7");
    expect(container.querySelector(".hk-stat-delta")).toBeNull();
    expect(container.querySelector(".hk-stat-caption")).toBeNull();
  });

  test("FND2-STATS-HINT supplied hint opens from its named action and dismisses", async () => {
    const user = userEvent.setup();
    render(<StatCards label="Metrics" items={[{ id: "sources", label: "Sources", value: 0, hint: "Only supplied sources are counted" }]} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "About Sources" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Only supplied sources are counted");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test.each([
    { label: "ordinary", colors: ["red", "blue"], arc: 180, speed: 2, bloom: true, strength: 0.5, expected: ["red", "blue", "180deg", "2s", "4px"] },
    { label: "single color", colors: ["green"], arc: 360, speed: 1, bloom: false, strength: 1, expected: ["green", "green", "360deg", "1s", "0px"] },
    { label: "upper bounds", colors: ["red", "blue"], arc: 900, speed: 90, bloom: true, strength: 4, expected: ["red", "blue", "360deg", "60s", "8px"] },
    { label: "lower bounds", colors: ["red", "blue"], arc: -1, speed: 0.01, bloom: true, strength: -1, expected: ["red", "blue", "0deg", "0.1s", "0px"] },
    { label: "nonfinite", colors: ["red", "blue"], arc: Infinity, speed: NaN, bloom: true, strength: NaN, expected: ["red", "blue", "270deg", "0.9s", "4px"] },
  ])("FND2-LOADER $label maps configuration safely and respects active state", ({ colors, arc, speed, bloom, strength, expected }) => {
    const { rerender } = render(<ComposerLoader label="Waiting for host" colors={colors} arc={arc} speed={speed} bloom={bloom} bloomStrength={strength} />);
    const loader = screen.getByRole("status");
    expect(loader).toHaveTextContent("Waiting for host");
    expect(["start", "end", "arc", "speed", "bloom"].map(key => loader.style.getPropertyValue(`--hk-loader-${key}`))).toEqual(expected);
    expect(loader.querySelector(".hk-composer-orbit")).toHaveAttribute("aria-hidden", "true");
    rerender(<ComposerLoader active={false} label="Waiting for host" />);
    expect(loader).toHaveAttribute("hidden");
    expect(loader).toHaveAttribute("inert");
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<ComposerLoader label="Host resumed" />);
    expect(screen.getByRole("status")).toBe(loader);
    expect(loader).toHaveTextContent("Host resumed");
  });

  test.each(["conversation", "composer"] as const)("FND2-LOADER-CONTEXT %s retains the host composition when waiting toggles", context => {
    const loader = <ComposerLoader active={false} label="Waiting" />;
    const { rerender } = render(context === "conversation" ? <section role="log">Existing message{loader}</section> : <Composer value="Draft"><Input aria-label="Retained field" defaultValue="Draft" />{loader}</Composer>);
    const inactive = screen.getByRole("status", { hidden: true });
    rerender(context === "conversation" ? <section role="log">Existing message<ComposerLoader label="Waiting" /></section> : <Composer value="Draft"><Input aria-label="Retained field" defaultValue="Draft" /><ComposerLoader label="Waiting" /></Composer>);
    expect(screen.getByRole("status")).toBe(inactive);
    if (context === "conversation") expect(screen.getByRole("log")).toHaveTextContent("Existing messageWaiting");
    else expect(screen.getByRole("textbox", { name: "Retained field" })).toHaveValue("Draft");
  });

  test.each(["underline", "pill"] as const)("FND2-TABS %s keeps icon/count label slots and host selection", async variant => {
    const user = userEvent.setup();
    const select = vi.fn();
    const items = [{ value: "overview", label: <><svg aria-hidden="true" data-testid="tab-icon" />Overview<Badge>3</Badge></>, content: "Overview content" }, { value: "sources", label: <>Sources<Badge>7</Badge></>, content: "Sources content" }];
    const { rerender } = render(<Tabs label="Evidence" variant={variant} items={items} value="overview" onValueChange={select} />);
    const overview = screen.getByRole("tab", { name: "Overview 3" });
    expect(within(overview).getByTestId("tab-icon")).toHaveAttribute("aria-hidden", "true");
    expect(overview.firstElementChild).toBe(within(overview).getByTestId("tab-icon"));
    expect(within(overview).getByText("3")).toHaveClass("hk-badge");
    await user.click(screen.getByRole("tab", { name: "Sources 7" }));
    expect(select).toHaveBeenCalledExactlyOnceWith("sources");
    expect(overview).toHaveAttribute("aria-selected", "true");
    rerender(<Tabs label="Evidence" variant={variant} items={items} value="sources" onValueChange={select} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Sources content");
    expect(screen.getByRole("tab", { name: "Sources 7" })).toHaveAttribute("aria-selected", "true");
  });

  test.each([false, true])("FND2-GROUP icon-only multiple=%s keeps names and native selected values", async multiple => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<ButtonGroup label="Format" name="format" multiple={multiple} defaultSelected={["pdf"]} onSelectionChange={select} items={[{ value: "pdf", label: "PDF", content: <svg aria-hidden="true" data-testid="pdf-icon" /> }, { value: "text", label: "Text", content: <svg aria-hidden="true" data-testid="text-icon" /> }]} />);
    const role = multiple ? "checkbox" : "radio";
    const text = screen.getByRole(role, { name: "Text" });
    expect(text.closest("label")?.textContent).toBe("");
    expect(within(text.closest("label")!).getByTestId("text-icon")).toHaveAttribute("aria-hidden", "true");
    await user.click(text);
    expect(text).toBeChecked();
    expect(select).toHaveBeenCalledExactlyOnceWith(multiple ? ["pdf", "text"] : ["text"]);
  });

  test("FND2-DATA-ROWS status chips and actions remain scoped to supplied rows", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const rows = [{ id: "ready", status: "Ready" }, { id: "blocked", status: "Blocked" }];
    const columns = [{ id: "status", label: "Status", render: (row: typeof rows[number]) => <Chip tone={row.id === "ready" ? "green" : "rose"}>{row.status}</Chip> }, { id: "action", label: "Action", render: (row: typeof rows[number]) => <Button disabled={row.id === "blocked"} onClick={() => action(row.id)}>Review {row.status}</Button> }];
    render(<DataTable caption="Supplied records" rows={rows} columns={columns} rowId={row => row.id} rowLabel={row => row.status} />);
    const table = screen.getByRole("table", { name: "Supplied records" });
    expect(within(table).getByText("Ready", { exact: true })).toHaveClass("hk-chip", "hk-tone--green");
    expect(within(table).getByText("Blocked", { exact: true })).toHaveClass("hk-chip", "hk-tone--rose");
    await user.click(within(table).getByRole("button", { name: "Review Ready" }));
    await user.click(within(table).getByRole("button", { name: "Review Blocked" }));
    expect(action).toHaveBeenCalledExactlyOnceWith("ready");
    expect(rows).toEqual([{ id: "ready", status: "Ready" }, { id: "blocked", status: "Blocked" }]);
  });

  test.each([2, 3])("FND2-OTP groupEvery=%s mirrors typed values and forwards invalid semantics", async groupEvery => {
    const user = userEvent.setup();
    const complete = vi.fn();
    const { container, rerender } = render(<InputOtp aria-label="Code" aria-invalid="true" length={6} groupEvery={groupEvery} onComplete={complete} />);
    const input = screen.getByRole("textbox", { name: "Code" });
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(container.querySelectorAll('[data-group-start="true"]')).toHaveLength(groupEvery === 2 ? 2 : 1);
    await user.type(input, "123456");
    expect(input).toHaveValue("123456");
    expect(Array.from(container.querySelectorAll("[data-otp-slot]"), slot => slot.textContent)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(complete).toHaveBeenCalledExactlyOnceWith("123456");
    rerender(<InputOtp aria-label="Code" length={6} groupEvery={groupEvery} onComplete={complete} />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(container.querySelector(".hk-otp-slots")).toHaveTextContent("123456");
    expect(screen.getByRole("textbox")).toHaveValue("123456");
  });

  test("FND2-RADIO-CARD native card content retains selection and disabled state", async () => {
    const user = userEvent.setup();
    render(<form><RadioCard label="Brief" description="Short result" name="format" value="brief" defaultChecked /><RadioCard label="Report" description="Full result" name="format" value="report" /><RadioCard label="Unavailable" name="format" value="blocked" disabled /></form>);
    expect(screen.getByRole("radio", { name: "Brief" })).toHaveAccessibleDescription("Short result");
    await user.click(screen.getByText("Report", { exact: true }));
    const report = screen.getByRole("radio", { name: "Report" });
    expect(report.closest("label")).toHaveClass("hk-choice-card");
    expect(report).toHaveAccessibleDescription("Full result");
    expect(report).toBeChecked();
    expect(screen.getByRole("radio", { name: "Brief" })).not.toBeChecked();
    expect(new FormData(report.closest("form")!).get("format")).toBe("report");
    expect(screen.getByRole("radio", { name: "Unavailable" })).toBeDisabled();
  });

  test.each([false, true])("FND2-ANNOUNCEMENT sidebar icon=%s supports optional slots without hiding refused state", async icon => {
    const user = userEvent.setup();
    const action = vi.fn();
    const dismiss = vi.fn();
    const { container, rerender } = render(<Sidebar label="Workspace" footer={<Announcement title="Update" description="Host details" icon={icon ? <svg data-testid="announcement-icon" /> : undefined} actionLabel="Explore" onAction={action} onDismiss={dismiss} />}><SidebarItem label="Inbox" badge={3} selected /></Sidebar>);
    expect(screen.getByRole("button", { name: "Inbox, 3" })).toHaveAttribute("aria-current", "page");
    expect(container.querySelector(".hk-sidebar .hk-announcement")).toContainElement(screen.getByRole("heading", { name: "Update" }));
    if (icon) expect(screen.getByTestId("announcement-icon").parentElement).toHaveAttribute("aria-hidden", "true");
    else expect(container.querySelector(".hk-announcement-icon")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Explore" }));
    await user.click(screen.getByRole("button", { name: "Dismiss Update" }));
    expect(action).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Update" })).toBeVisible();
    rerender(<Announcement title="Title only" />);
    expect(screen.getByRole("heading", { name: "Title only" })).toBeVisible();
    expect(container.querySelector("p, .hk-announcement-icon, .hk-announcement-action")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  test.each([false, true])("FND2-COMPOSER preview=%s retains idle parts and callback-only submission", async preview => {
    const user = userEvent.setup();
    const send = vi.fn(() => false);
    const composition = <Composer value="Host draft" onSubmit={send}><GlassComposer><PromptInputTextarea aria-label="Draft" /><PromptInputFooter><PromptInputSubmit /></PromptInputFooter></GlassComposer><StatusBar>Ready</StatusBar><ComposerLoader active={false} /></Composer>;
    const { container } = render(preview ? <AiChatComposerPreview>{composition}</AiChatComposerPreview> : composition);
    expect(container.querySelector(".hk-ai-chat-composer-preview") !== null).toBe(preview);
    expect(container.querySelector(".hk-glass-composer")).toContainElement(screen.getByRole("textbox", { name: "Draft" }));
    expect(container.querySelector(".hk-status-bar")).toHaveTextContent("Ready");
    expect(screen.queryByRole("status")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(send).toHaveBeenCalledExactlyOnceWith("Host draft");
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("Host draft");
  });
});
