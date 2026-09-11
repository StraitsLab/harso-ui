import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Image } from "./image";
import { renderToStaticMarkup } from "react-dom/server";

describe("Image", () => {
  it.each(["https://user:pass@example.invalid/a", "//user:pass@example.invalid/a", "https://user@example.invalid/a", "file:///private/a", "data:text/html,test", "java\nscript:alert(1)"])("rejects inadmissible image sources before DOM or preload rendering: %s", src => {
    const markup = renderToStaticMarkup(<Image src={src} />);
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("<link");
    expect(markup).not.toContain(src);
    render(<Image src={src} />);
    expect(screen.getByRole("img")).not.toHaveAttribute("src");
  });
  it("rejects non-image generated media and credential srcsets", () => {
    expect(renderToStaticMarkup(<Image image={{ base64: "abc", mediaType: "text/html" }} />)).not.toContain("<img");
    const markup = renderToStaticMarkup(<Image src="/safe.png" srcSet="/safe.png 1x, https://user:pass@example.invalid/a 2x" />);
    expect(markup).not.toContain("user:pass");
  });
  it("preserves ordinary responsive candidates and recovers after a rejected source", () => {
    const view = render(<Image src="https://user:pass@example.invalid/a" />);
    view.rerender(<Image src="/safe.png" srcSet="/safe.png 1x, /large.png 2x" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/safe.png");
    expect(screen.getByRole("img")).toHaveAttribute("srcset", "/safe.png 1x, /large.png 2x");
  });
  it.each(["/safe.png", "https://example.invalid/a", "blob:https://example.invalid/id", "data:image/png;base64,abc"])("preserves safe image source %s", src => {
    render(<Image src={src} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", src);
  });
  it("recovers for a replacement source and supports byte data", () => {
    const view = render(<Image src="/broken.png" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("No image available")).toBeVisible();
    view.rerender(<Image image={{ uint8Array: new Uint8Array([65, 66, 67]), mediaType: "image/png" }} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "data:image/png;base64,QUJD");
    view.rerender(<Image src="/broken.png" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/broken.png");
  });
  it("turns host-supplied generated image data into a data URL", () => {
    render(<Image image={{ base64: "abc", mediaType: "image/png" }} alt="Generated" />);
    expect(screen.getByRole("img", { name: "Generated" })).toHaveAttribute("src", "data:image/png;base64,abc");
  });

  it("renders an accessible empty state when no image is supplied", () => {
    render(<Image alt="Generated result" />);
    expect(screen.getByRole("img", { name: "Generated result" })).toHaveTextContent("No image available");
  });
});
