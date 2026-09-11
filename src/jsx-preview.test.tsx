import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JSXPreview, JSXPreviewContent, JSXPreviewError } from "./jsx-preview";

describe("JSXPreview", () => {
  it("renders a trusted custom React child while executable-looking source stays inert", () => {
    const activate = vi.fn();
    function CustomAction({ label }: { label: string }) { return <button onClick={activate}>{label}</button>; }
    const source = '<CustomAction label="Source action" />{globalThis.__jsxExecuted = true}<script>globalThis.__jsxExecuted = true</script>';
    const view = render(<JSXPreview jsx={source}><JSXPreviewContent><CustomAction label="Trusted action" /></JSXPreviewContent></JSXPreview>);
    expect(screen.getByRole("button", { name: "Trusted action" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Source action" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(Reflect.get(globalThis, "__jsxExecuted")).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Trusted action" }));
    expect(activate).toHaveBeenCalledOnce();
    view.rerender(<JSXPreview jsx={source} />);
    expect(view.container.querySelector("code")).toHaveTextContent(source);
    expect(view.container.querySelector("script")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(Reflect.get(globalThis, "__jsxExecuted")).toBeUndefined();
  });
  it.each(["components", "bindings", "onError"] as const)("explicitly refuses unsupported %s without inspecting or invoking it", prop => {
    const onError = vi.fn();
    const opaque = new Proxy({}, { get: () => { throw new Error("private-get"); }, ownKeys: () => { throw new Error("private-keys"); } });
    const unsupported = prop === "onError" ? { onError } : { [prop]: opaque };
    const view = render(<JSXPreview jsx="<Unknown />" {...unsupported} />);
    expect(screen.getByRole("alert")).toHaveTextContent("components, bindings, and onError are unsupported");
    expect(screen.getByRole("alert")).toHaveTextContent("host-rendered children");
    expect(screen.getByText("<Unknown />")).toBeVisible();
    expect(view.container.innerHTML).not.toContain("private-");
    expect(onError).not.toHaveBeenCalled();
    view.rerender(<JSXPreview jsx="<Unknown />" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("presents trusted host children without evaluating source or registry components", () => {
    const registryComponent = vi.fn(() => <span>Must not run</span>);
    const activate = vi.fn();
    const view = render(<JSXPreview jsx="<Registry />" components={{ Registry: registryComponent }}><JSXPreviewContent><button onClick={activate}>Host action</button></JSXPreviewContent></JSXPreview>);
    expect(screen.getByRole("alert")).toHaveTextContent("JSX source is not executed");
    expect(registryComponent).not.toHaveBeenCalled();
    expect(screen.queryByText("<Registry />")).toBeNull();
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Host action" }));
    expect(activate).toHaveBeenCalledOnce();
    view.rerender(<JSXPreview jsx=""><JSXPreviewContent>Replacement supplied by host</JSXPreviewContent></JSXPreview>);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Replacement supplied by host")).toBeVisible();
  });
  it("reports empty and waiting source without inventing rendered output", () => {
    const view = render(<JSXPreview jsx="" />);
    expect(screen.getByRole("status")).toHaveTextContent("No JSX supplied");
    view.rerender(<JSXPreview jsx="" isStreaming />);
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for JSX");
  });
  it("never forwards bindings or component registries into markup", () => {
    const view = render(<JSXPreview jsx="<Thing />" bindings={{ toString: () => "private-binding" }} components={{ toString: () => "private-component" }} />);
    expect(view.container.innerHTML).not.toContain("private-");
    expect(view.container.firstChild).not.toHaveAttribute("bindings");
    expect(view.container.firstChild).not.toHaveAttribute("components");
  });
  it("keeps streamed JSX inert and visible to the host", () => {
    render(<JSXPreview jsx="<Button>Send</Button>" isStreaming />);
    expect(screen.getByText("<Button>Send</Button>")).toBeInTheDocument();
    expect(screen.getByText("<Button>Send</Button>").closest(".hk-jsx-preview")).toHaveAttribute("data-streaming", "true");
  });
  it("supports an explicit error slot", () => { render(<JSXPreviewError>Preview failed</JSXPreviewError>); expect(screen.getByText("Preview failed")).toBeInTheDocument(); });
});
