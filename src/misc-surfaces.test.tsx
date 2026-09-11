import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthCard, AuthMediaCarousel, Color, Persona, SettingsModal, SocialButton, Typography } from "./misc-surfaces";
import miscStyles from "./misc-surfaces.css?raw";

describe("misc surfaces", () => {
  it("color values cannot turn a swatch into a remote background image", () => {
    const view = render(<Color value="url(https://example.test/tracker.png)" />);
    expect((view.container.querySelector(".hk-color-swatch") as HTMLElement).style.backgroundImage).toBe("");
  });
  it("auth modes compose native fields, layout, slots and controlled submission without storing credentials", () => {
    const submit = vi.fn(); const provider = vi.fn();
    const view = render(<AuthCard mode="signup" layout="split" logo={<span>Host logo</span>} artwork={<span>Host artwork</span>} footnote={<span>Host terms</span>} confirmPassword providers={[{ id: "github", label: "GitHub", onSelect: provider }]} providerLayout="grid" onSubmitData={submit} />);
    expect(view.container.querySelector(".hk-auth-card")).toHaveAttribute("data-layout", "split");
    for (const text of ["Host logo", "Host artwork", "Host terms"]) expect(screen.getByText(text)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sample@example.test" } });
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "example-only" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "mismatch" } });
    fireEvent.submit(screen.getByRole("form"));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Confirm password")).toBeInvalid();
    fireEvent.input(screen.getByLabelText("Confirm password"), { target: { value: "example-only" } });
    fireEvent.submit(screen.getByRole("form"));
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0][0].get("email")).toBe("sample@example.test");
    expect(screen.getByLabelText("Email")).toHaveValue("sample@example.test");
    fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(provider).toHaveBeenCalledOnce();
    view.rerender(<AuthCard mode="signin" onSubmitData={submit} />);
    expect(screen.queryByLabelText("Confirm password")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute("autocomplete", "current-password");
  });

  it("verification, provider, submit and resend requests honor host refusal and disabled/pending state", () => {
    const submit = vi.fn(); const resend = vi.fn(); const change = vi.fn(); const provider = vi.fn();
    const view = render(<AuthCard mode="verify" values={{ code: "123456" }} onFieldChange={change} onSubmitData={submit} onResend={resend} error="Host verification error" />);
    const code = screen.getByLabelText("Verification code");
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
    fireEvent.change(code, { target: { value: "654321" } });
    expect(change).toHaveBeenCalledExactlyOnceWith("code", "654321");
    expect(code).toHaveValue("123456");
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    expect(resend).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent("Host verification error");
    view.rerender(<AuthCard mode="verify" values={{ code: "654321" }} onSubmitData={submit} onResend={resend} pending providers={[{ id: "github", onSelect: provider }]} />);
    expect(code).toHaveValue("654321");
    fireEvent.submit(screen.getByRole("form"));
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    expect(submit).not.toHaveBeenCalled(); expect(resend).toHaveBeenCalledOnce(); expect(provider).not.toHaveBeenCalled();
    expect(code).toBeDisabled();
    view.rerender(<AuthCard mode="verify" values={{ code: "654321" }} onSubmitData={submit} onSubmit={event => event.preventDefault()} />);
    fireEvent.submit(screen.getByRole("form"));
    expect(submit).not.toHaveBeenCalled();
  });

  it("auth never falls through to native credential navigation, even when a host handler throws", () => {
    const suppress = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener("error", suppress);
    try {
      render(<AuthCard mode="signin" onSubmitData={vi.fn()} onSubmit={() => { throw new Error("Host rejected submission"); }} />);
      expect(fireEvent.submit(screen.getByRole("form"))).toBe(false);
    } finally { window.removeEventListener("error", suppress); }
  });

  it("auth rejects incomplete verification and malformed email before handing FormData to the host", () => {
    const submit = vi.fn();
    const view = render(<AuthCard mode="verify" onSubmitData={submit} />);
    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123" } });
    fireEvent.submit(screen.getByRole("form")); expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.submit(screen.getByRole("form")); expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0][0].get("code")).toBe("123456");
    view.rerender(<AuthCard mode="signin" onSubmitData={submit} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "example-only" } });
    fireEvent.submit(screen.getByRole("form")); expect(submit).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Email")).toBeInvalid();
  });

  it.each(["stacked", "inline", "grid"] as const)("auth provider layout %s and disabled mode remain presentation-only", providerLayout => {
    const submit = vi.fn(); const nativeSubmit = vi.fn(); const resend = vi.fn();
    const view = render(<AuthCard mode="verify" layout="centered" providerLayout={providerLayout} disabled onSubmit={nativeSubmit} onSubmitData={submit} onResend={resend} providers={[{ id: "github", href: "/auth/github" }]} />);
    expect(screen.getByRole("group", { name: "Sign-in providers" })).toHaveAttribute("data-layout", providerLayout);
    expect(view.container.querySelector(".hk-auth-card")).toHaveAttribute("data-layout", "centered");
    expect(screen.getByRole("link")).not.toHaveAttribute("href");
    fireEvent.submit(screen.getByRole("form")); fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    expect(submit).not.toHaveBeenCalled(); expect(nativeSubmit).not.toHaveBeenCalled(); expect(resend).not.toHaveBeenCalled();
  });

  it("social custom icon, size, label and full width are native presentation choices", () => {
    const view = render(<SocialButton provider="Custom brand" iconOnly icon={<svg data-testid="brand-icon" />} fullWidth size="small" appearance="black" />);
    const button = screen.getByRole("button", { name: "Continue with Custom brand" });
    expect(button).toHaveClass("hk-social-button--full", "hk-button--small", "hk-social-button--black");
    expect(screen.getByTestId("brand-icon").parentElement).toHaveAttribute("aria-hidden", "true");
    view.rerender(<SocialButton provider="Custom brand" href="https://example.test/auth" pending appearance="white" />);
    expect(screen.getByRole("link")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("link")).not.toHaveAttribute("href");
  });

  it("color preview refuses disabled synthetic changes and remount resets local selection", () => {
    const change = vi.fn(); const appearance = vi.fn();
    const view = render(<Color editable defaultValue="#145cba" disabled onValueChange={change} onAppearanceChange={appearance} />);
    fireEvent.change(screen.getByLabelText("Accent preset"), { target: { value: "#7c3aed" } });
    fireEvent.change(screen.getByLabelText("Custom accent"), { target: { value: "#112233" } });
    fireEvent.change(screen.getByLabelText("Preview appearance"), { target: { value: "dark" } });
    expect(change).not.toHaveBeenCalled(); expect(appearance).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Custom accent")).toHaveValue("#145cba");
    view.rerender(<Color key="reset" editable defaultValue="#abcdef" defaultAppearance="dark" />);
    expect(screen.getByLabelText("Custom accent")).toHaveValue("#abcdef");
    expect(screen.getByLabelText("Preview appearance")).toHaveValue("dark");
  });

  it("color exposes all eight original preset choices and paints the selected accent", () => {
    render(<Color editable defaultValue="#000000" />);
    for (const [name, value] of [["Blue", "#145cba"], ["Violet", "#7c3aed"], ["Pink", "#be185d"], ["Red", "#b3313b"], ["Amber", "#885000"], ["Emerald", "#287346"], ["Cyan", "#0e7490"], ["Indigo", "#4338ca"]]) {
      expect(screen.getByRole("option", { name })).toHaveValue(value);
      fireEvent.change(screen.getByLabelText("Accent preset"), { target: { value } });
      expect(screen.getByLabelText("Custom accent")).toHaveValue(value);
      expect(screen.getByText(value).querySelector(".hk-color-swatch")).toHaveStyle({ background: value });
    }
  });

  it("social anchors allow native safe navigation but suppress unsafe, disabled and auxiliary activation", () => {
    const click = vi.fn(event => event.preventDefault()); const aux = vi.fn();
    const view = render(<SocialButton provider="GitHub" href="/auth/github" target="_blank" onClick={click} onAuxClick={aux} />);
    const link = screen.getByRole("link", { name: "Continue with GitHub" });
    expect(link).toHaveAttribute("href", "/auth/github"); expect(link).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(link); expect(click).toHaveBeenCalledOnce();
    for (const href of ["javascript:alert(1)", "data:text/html,hello", "//evil.test", "/\\evil.test", "https://name:password@example.test", "java\nscript:alert(1)"]) {
      view.rerender(<SocialButton provider="GitHub" href={href} onClick={click} onAuxClick={aux} />);
      expect(link).not.toHaveAttribute("href"); expect(link).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(link); fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true }));
    }
    view.rerender(<SocialButton provider="GitHub" href="https://example.test/oauth" disabled onClick={click} />);
    expect(link).not.toHaveAttribute("href"); expect(link).toHaveAttribute("tabindex", "-1");
    fireEvent.click(link); expect(click).toHaveBeenCalledOnce(); expect(aux).not.toHaveBeenCalled();
  });

  it("auth provider callbacks can refuse native anchor navigation", () => {
    const select = vi.fn(() => false);
    render(<AuthCard providers={[{ id: "github", href: "/auth/github", onSelect: select }]} />);
    expect(fireEvent.click(screen.getByRole("link", { name: "Continue with github" }))).toBe(false);
    expect(select).toHaveBeenCalledOnce();
  });

  it("color preview supports preset/custom accents, role groups and host-controlled theme refusal", () => {
    const change = vi.fn(); const theme = vi.fn();
    const view = render(<Color editable value="#145cba" onValueChange={change} appearance="light" onAppearanceChange={theme} />);
    fireEvent.change(screen.getByLabelText("Accent preset"), { target: { value: "#7c3aed" } });
    expect(change).toHaveBeenCalledExactlyOnceWith("#7c3aed");
    expect(screen.getByLabelText("Custom accent")).toHaveValue("#145cba");
    fireEvent.change(screen.getByLabelText("Preview appearance"), { target: { value: "dark" } });
    expect(theme).toHaveBeenCalledExactlyOnceWith("dark");
    expect(view.container.querySelector(".harso-kit")).toHaveAttribute("data-mode", "light");
    expect(view.container.querySelector(".hk-color-preview")).toHaveAttribute("data-palette", "clean");
    for (const role of ["Foreground", "Text", "Background", "Border", "Graphs", "State"]) expect(screen.getByRole("group", { name: role })).toBeVisible();
    view.rerender(<Color editable value="#abcdef" appearance="dark" palette="cozy" disabled />);
    expect(screen.getByLabelText("Custom accent")).toHaveValue("#abcdef"); expect(screen.getByLabelText("Custom accent")).toBeDisabled();
    expect(view.container.querySelector(".harso-kit")).toHaveAttribute("data-mode", "dark");
    expect(view.container.querySelector(".hk-color-preview")).toHaveAttribute("data-palette", "cozy");
    expect(view.container.querySelector("[palette]")).toBeNull();
    view.rerender(<Color editable value="#abcdef" appearance="dark" palette="clean" />);
    expect(view.container.querySelector(".hk-color-preview")).toHaveAttribute("data-palette", "clean");
    view.unmount(); render(<Color editable defaultValue="#145cba" />);
    fireEvent.change(screen.getByLabelText("Custom accent"), { target: { value: "#112233" } });
    expect(screen.getByLabelText("Custom accent")).toHaveValue("#112233");
  });
  it("typography provides the documented scale and weight combinations without adding heading semantics", () => {
    const style = document.createElement("style");
    style.textContent = miscStyles.replace(/^@import.*$/gm, "");
    document.head.append(style);
    try {
      const scales = { "large-title": 34, "display-1": 64, "display-2": 56, "display-3": 48, "display-4": 40, "title-1": 28, "title-2": 22, "title-3": 20, headline: 17, body: 15, "body-2": 14, "caption-1": 12, "caption-2": 11 } as const;
      const weights = { regular: "400", medium: "500", semibold: "600", bold: "700" } as const;
      const view = render(<Typography>Sample</Typography>);
      for (const variant of Object.keys(scales) as (keyof typeof scales)[]) for (const weight of Object.keys(weights) as (keyof typeof weights)[]) {
        view.rerender(<Typography variant={variant} weight={weight}>Sample</Typography>);
        expect(getComputedStyle(screen.getByText("Sample")).fontSize).toBe(`${scales[variant]}px`);
        expect(getComputedStyle(screen.getByText("Sample")).fontWeight).toBe(weights[weight]);
      }
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    } finally { style.remove(); }
  });

  it("auth composition preserves native FormData, validation attributes and host refusal", () => {
    const submit = vi.fn();
    render(<AuthCard title="Sign in"><form aria-label="Sign in form" onSubmit={event => { event.preventDefault(); submit(new FormData(event.currentTarget).get("email")); }}><label>Email<input name="email" type="email" required defaultValue="mira@example.test" /></label><button type="submit">Sign in</button><SocialButton provider="GitHub" disabled /></form></AuthCard>);
    const email = screen.getByRole("textbox", { name: "Email" });
    expect(email).toBeRequired();
    expect(email).toHaveAttribute("type", "email");
    fireEvent.submit(screen.getByRole("form", { name: "Sign in form" }));
    expect(submit).toHaveBeenCalledExactlyOnceWith("mira@example.test");
    expect(email).toHaveValue("mira@example.test");
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeDisabled();
  });

  it("color keeps custom values visible to assistive technology and accepts host updates", () => {
    const view = render(<Color value="#123456" label="Custom accent" />);
    expect(screen.getByText("Custom accent")).toBeVisible();
    expect(view.container.querySelector(".hk-color-swatch")).toHaveAttribute("aria-hidden", "true");
    expect(view.container.querySelector(".hk-color-swatch")).toHaveStyle({ background: "#123456" });
    view.rerender(<Color value="#abcdef" />);
    expect(screen.getByText("#abcdef")).toBeVisible();
    expect(view.container.querySelector(".hk-color-swatch")).toHaveStyle({ background: "#abcdef" });
  });
  it("social buttons retain visible custom labels and native disabled and submit semantics", () => {
    const request = vi.fn();
    const view = render(<SocialButton provider="GitHub" onClick={request}>Connect GitHub</SocialButton>);
    fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));
    expect(request).toHaveBeenCalledOnce();
    view.rerender(<SocialButton provider="GitHub" disabled onClick={request}>Connect GitHub</SocialButton>);
    fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));
    expect(request).toHaveBeenCalledOnce();
    view.rerender(<SocialButton provider="GitHub" type="submit" aria-label="Host label" />);
    expect(screen.getByRole("button", { name: "Host label" })).toHaveAttribute("type", "submit");
  });
  it("opens from isOpen, navigates all pages and resets to default on reopen", () => {
    const { rerender } = render(<SettingsModal isOpen defaultPage="profile" pages={{ profile: <p>Host identity</p>, tools: <p>Host tools</p> }} />);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Host identity")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^Tools$/ }));
    expect(screen.getByText("Host tools")).toBeVisible();
    rerender(<SettingsModal isOpen={false} defaultPage="profile" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<SettingsModal isOpen defaultPage="profile" />);
    expect(screen.getByRole("button", { name: /^Profile$/ })).toHaveAttribute("aria-current", "page");
  });
  it("portals to body and requests Escape closure without overriding host refusal", () => {
    const close = vi.fn();
    const { container } = render(<SettingsModal isOpen onClose={close} />);
    expect(container.querySelector("dialog")).toBeNull();
    expect(document.body.querySelector("dialog")).not.toBeNull();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("shows native artwork or supplied artwork without inventing account values", async () => {
    const { rerender } = render(<SettingsModal isOpen />);
    expect(screen.getByLabelText("Plan artwork")).toHaveAttribute("data-artwork", "native");
    rerender(<SettingsModal isOpen planArtSrc="/plan.png" />);
    const image = screen.getByRole("img", { name: "Plan artwork" });
    expect(image).toHaveAttribute("src", "/plan.png");
    fireEvent.error(image);
    await waitFor(() => expect(screen.getByLabelText("Plan artwork")).toHaveAttribute("data-artwork", "native"));
  });
  it("restores initiating focus when the host unmounts the open modal", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const view = render(<SettingsModal isOpen />);
    view.unmount();
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });
  it("routes native dialog closure through host control", () => {
    const close = vi.fn();
    render(<SettingsModal isOpen onClose={close} />);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    dialog.open = false;
    fireEvent(dialog, new Event("close"));
    expect(close).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
  });
  it("renders accessible visual primitives and modal actions", () => {
    const onClose = vi.fn();
    render(<><Color value="#fff" /><Persona state="thinking" /><SocialButton provider="GitHub" /><SettingsModal open onClose={onClose}>Preferences</SettingsModal><AuthCard title="Sign in" /></>);
    expect(screen.getByLabelText("Persona thinking")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Persona thinking" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close settings" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("supports keyboard and button navigation without owning slide content", () => {
    render(<AuthMediaCarousel><span>First</span><span>Second</span><span>Third</span></AuthMediaCarousel>);
    const carousel = screen.getByRole("region", { name: "Authentication media" });
    expect(screen.getByText("First")).toBeVisible();
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(screen.getByText("Second")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Show media 3" }));
    expect(screen.getByText("Third")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next media" })).toBeDisabled();
    fireEvent.keyDown(carousel, { key: "Home" });
    expect(screen.getByText("First")).toBeVisible();
  });

  it("clamps local selection when slides shrink and does not revive it when slides return", () => {
    const request = vi.fn();
    const view = render(<AuthMediaCarousel defaultIndex={2} onIndexChange={request}><span>First</span><span>Second</span><span>Third</span></AuthMediaCarousel>);
    view.rerender(<AuthMediaCarousel onIndexChange={request}><span>First</span></AuthMediaCarousel>);
    expect(screen.getByText("First")).toBeVisible();
    view.rerender(<AuthMediaCarousel onIndexChange={request}><span>First</span><span>Second</span><span>Third</span></AuthMediaCarousel>);
    expect(screen.getByText("First")).toBeVisible();
    expect(request).not.toHaveBeenCalled();
  });

  it("preserves keyed slide input state and focus when a preceding slide is removed", () => {
    const intro = <span key="intro">Introduction</span>;
    const draft = <input key="draft" aria-label="Workspace draft" defaultValue="" />;
    const view = render(<AuthMediaCarousel defaultIndex={1}>{[intro, draft]}</AuthMediaCarousel>);
    const input = screen.getByRole("textbox", { name: "Workspace draft" });
    fireEvent.change(input, { target: { value: "Unsubmitted workspace" } });
    input.focus();
    view.rerender(<AuthMediaCarousel defaultIndex={1}>{[draft]}</AuthMediaCarousel>);
    expect(screen.getByRole("textbox", { name: "Workspace draft" })).toBe(input);
    expect(input).toHaveValue("Unsubmitted workspace");
    expect(input).toHaveFocus();
    expect(input).toBeVisible();
  });

  it("preserves a caller-supplied native accessible name", () => {
    render(<AuthMediaCarousel aria-label="Workspace onboarding" label="Fallback"><span>Introduction</span></AuthMediaCarousel>);
    expect(screen.getByRole("region", { name: "Workspace onboarding" })).toBeVisible();
  });

  it.each([NaN, Infinity, -Infinity, -3, 0.5])("normalizes invalid index %s in controlled and local modes", index => {
    const view = render(<AuthMediaCarousel index={index}><span>First</span><span>Second</span></AuthMediaCarousel>);
    expect(screen.getByText("First")).toBeVisible();
    view.unmount();
    render(<AuthMediaCarousel defaultIndex={index}><span>First</span><span>Second</span></AuthMediaCarousel>);
    expect(screen.getByText("First")).toBeVisible();
  });

  it("bounds large indices and accepts host updates without calling back", () => {
    const request = vi.fn();
    const view = render(<AuthMediaCarousel index={20} onIndexChange={request}><span>First</span><span>Second</span></AuthMediaCarousel>);
    expect(screen.getByText("Second")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Previous media" }));
    expect(request).toHaveBeenCalledExactlyOnceWith(0);
    expect(screen.getByText("Second")).toBeVisible();
    view.rerender(<AuthMediaCarousel index={0} onIndexChange={request}><span>First</span><span>Second</span></AuthMediaCarousel>);
    expect(screen.getByText("First")).toBeVisible();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("leaves descendant editing keys and modified shortcuts to the host", () => {
    const request = vi.fn();
    render(<AuthMediaCarousel onIndexChange={request}><input aria-label="Caption" /><span>Second</span></AuthMediaCarousel>);
    const input = screen.getByRole("textbox", { name: "Caption" });
    input.focus();
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
      expect(fireEvent.keyDown(input, { key })).toBe(true);
      for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
        expect(fireEvent.keyDown(screen.getByRole("region"), { key, [modifier]: true })).toBe(true);
      }
    }
    expect(input).toBeVisible();
    expect(input).toHaveFocus();
    expect(request).not.toHaveBeenCalled();
  });

  it("honors a cancelled host keyboard event before changing selection", () => {
    const request = vi.fn();
    render(<AuthMediaCarousel onKeyDown={event => event.preventDefault()} onIndexChange={request}><span>First</span><span>Second</span></AuthMediaCarousel>);
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(screen.getByText("First")).toBeVisible();
    expect(request).not.toHaveBeenCalled();
  });

  it("uses directional arrows in RTL and logical Home and End positions", () => {
    render(<AuthMediaCarousel style={{ direction: "rtl" }}><span>First</span><span>Second</span><span>Third</span></AuthMediaCarousel>);
    const carousel = screen.getByRole("region");
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(screen.getByText("Second")).toBeVisible();
    fireEvent.keyDown(carousel, { key: "End" });
    expect(screen.getByText("Third")).toBeVisible();
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(screen.getByText("Second")).toBeVisible();
    fireEvent.keyDown(carousel, { key: "Home" });
    expect(screen.getByText("First")).toBeVisible();
  });

  it("does not emit changes at boundaries, on active indicators or with empty content", () => {
    const request = vi.fn();
    const view = render(<AuthMediaCarousel onIndexChange={request}><span>First</span><span>Second</span></AuthMediaCarousel>);
    fireEvent.keyDown(screen.getByRole("region"), { key: "Home" });
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: "Show media 1" }));
    expect(request).not.toHaveBeenCalled();
    view.rerender(<AuthMediaCarousel onIndexChange={request} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(fireEvent.keyDown(screen.getByRole("region"), { key: "End" })).toBe(true);
    expect(request).not.toHaveBeenCalled();
    view.rerender(<AuthMediaCarousel onIndexChange={request}><span>Only slide</span></AuthMediaCarousel>);
    expect(screen.getByText("Only slide")).toBeVisible();
  });
});
