import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WebPreview, WebPreviewBody, WebPreviewConsole, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewUrl } from "./web-preview";

describe("WebPreview", () => {
  it.each(["ALLOW-SAME-ORIGIN", "Allow-Same-Origin", "allow-same-origin"])("strips %s regardless of casing or whitespace", token => {
    render(<WebPreview><WebPreviewBody srcDoc="<p>Untrusted</p>" sandbox={`allow-scripts\t${token}\n${token}`} referrerPolicy="unsafe-url" /></WebPreview>);
    expect(screen.getByTitle("Web preview")).toHaveAttribute("sandbox", "allow-scripts");
    expect(screen.getByTitle("Web preview")).toHaveAttribute("referrerpolicy", "no-referrer");
  });
  it("remounts document identity changes but preserves unchanged frames", () => {
    const view = render(<WebPreview><WebPreviewBody srcDoc="<p>Local</p>" /></WebPreview>);
    const localFrame = screen.getByTitle("Web preview");
    view.rerender(<WebPreview><WebPreviewBody src="http://localhost/result" /></WebPreview>);
    const remoteFrame = screen.getByTitle("Web preview");
    expect(remoteFrame).not.toBe(localFrame);
    expect(remoteFrame).not.toHaveAttribute("srcdoc");
    expect(remoteFrame).toHaveAttribute("sandbox", "allow-scripts");
    expect(remoteFrame).toHaveAttribute("referrerpolicy", "no-referrer");
    view.rerender(<WebPreview><WebPreviewBody src="http://localhost/result" title="Renamed" /></WebPreview>);
    expect(screen.getByTitle("Renamed")).toBe(remoteFrame);
    view.rerender(<WebPreview><WebPreviewBody srcDoc="<p>New local</p>" /></WebPreview>);
    expect(screen.getByTitle("Web preview")).not.toBe(remoteFrame);
  });
  it("resets load feedback and never grants same-origin frame privileges", () => {
    const view = render(<WebPreview><WebPreviewBody /></WebPreview>);
    expect(screen.getByRole("status")).toHaveTextContent("No preview URL supplied");
    view.rerender(<WebPreview><WebPreviewBody src="https://example.com" loading={<span>Loading preview</span>} sandbox="allow-scripts allow-same-origin" referrerPolicy="unsafe-url" /></WebPreview>);
    const frame = screen.getByTitle("Web preview");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(screen.getByText("Loading preview")).toBeVisible();
    fireEvent.load(frame); expect(screen.queryByText("Loading preview")).toBeNull();
    view.rerender(<WebPreview><WebPreviewBody src="https://other.example" loading={<span>Loading preview</span>} /></WebPreview>);
    expect(screen.getByText("Loading preview")).toBeVisible();
  });
  it("rejects unsafe addresses without putting them in the frame", () => {
    const view = render(<WebPreview defaultUrl="javascript:alert(1)"><WebPreviewBody /></WebPreview>);
    expect(screen.queryByTitle("Web preview")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("Preview URL unavailable");
    view.rerender(<WebPreview><WebPreviewBody src="https://user:private@example.com" /></WebPreview>);
    expect(view.container.innerHTML).not.toContain("private");
  });
  it("honors controlled URL refusal and prevented reloads", () => {
    const change = vi.fn();
    render(<WebPreview url="https://example.com" onUrlChange={change}><WebPreviewUrl /><WebPreviewNavigationButton tooltip="Reload" onClick={event => event.preventDefault()}>Reload</WebPreviewNavigationButton><WebPreviewBody /></WebPreview>);
    const frame = screen.getByTitle("Web preview");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://other.example" } });
    expect(change).toHaveBeenCalledWith("https://other.example");
    expect(frame).toHaveAttribute("src", "https://example.com");
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(screen.getByTitle("Web preview")).toBe(frame);
  });
  it("keeps URL and reload behavior host-controlled", async () => {
    render(<WebPreview defaultUrl="https://example.com"><WebPreviewNavigation><WebPreviewNavigationButton aria-label="Reload preview">↻</WebPreviewNavigationButton><WebPreviewUrl /></WebPreviewNavigation><WebPreviewBody /><WebPreviewConsole logs={["ready"]} /></WebPreview>);
    expect(screen.getByRole("textbox", { name: "Preview URL" })).toHaveValue("https://example.com");
    expect(screen.getByTitle("Web preview")).toHaveAttribute("src", "https://example.com");
    expect(screen.getByTitle("Web preview")).toHaveAttribute("sandbox", "allow-scripts");
    expect(screen.getByTitle("Web preview")).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(screen.getByText("ready")).toBeInTheDocument();
  });
});
