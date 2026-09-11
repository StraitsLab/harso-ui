import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineCitation, InlineCitationCard, InlineCitationCardBody, InlineCitationCardTrigger, InlineCitationCarousel, InlineCitationCarouselHeader, InlineCitationCarouselIndex, InlineCitationCarouselNext, InlineCitationCarouselContent, InlineCitationCarouselItem, InlineCitationQuote, InlineCitationSource, InlineCitationText } from "./inline-citation";

describe("InlineCitation", () => {
  it("lets the host cancel citation navigation", () => {
    render(<InlineCitationCarousel><InlineCitationCarouselIndex /><InlineCitationCarouselNext onClick={event => event.preventDefault()} /><InlineCitationCarouselContent><InlineCitationCarouselItem>First</InlineCitationCarouselItem><InlineCitationCarouselItem>Second</InlineCitationCarouselItem></InlineCitationCarouselContent></InlineCitationCarousel>);
    fireEvent.click(screen.getByRole("button", { name: "Next citation" }));
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeVisible();
  });
  it("clamps selection after source removal and reports an empty carousel", () => {
    const view = (names: string[]) => <InlineCitationCarousel><InlineCitationCarouselIndex /><InlineCitationCarouselNext /><InlineCitationCarouselContent>{names.map(name => <InlineCitationCarouselItem key={name}>{name}</InlineCitationCarouselItem>)}</InlineCitationCarouselContent></InlineCitationCarousel>;
    const { rerender } = render(view(["First", "Second"]));
    fireEvent.click(screen.getByRole("button", { name: "Next citation" }));
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("First")).not.toBeVisible();
    rerender(view(["First"]));
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeVisible();
    rerender(view([]));
    expect(screen.getByText("0/0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next citation" })).toBeDisabled();
  });

  it("handles malformed source labels and refuses unsafe source URLs", () => {
    render(<><InlineCitationCardTrigger sources={["https://["]} /><InlineCitationSource title="Unsafe" url="javascript:alert(1)" /></>);
    expect(screen.getByRole("button", { name: /Open citation/ })).toBeInTheDocument();
    expect(screen.getByText("Unsafe").closest("a")).not.toHaveAttribute("href");
  });
  it("renders a focused citation card with source details", () => {
    render(<InlineCitation><InlineCitationText>Evidence</InlineCitationText><InlineCitationCard><InlineCitationCardTrigger sources={["https://example.com/source"]} /><InlineCitationCardBody><InlineCitationCarousel><InlineCitationCarouselHeader><InlineCitationCarouselIndex /><InlineCitationCarouselNext /></InlineCitationCarouselHeader><InlineCitationCarouselContent><InlineCitationCarouselItem><InlineCitationSource title="Example source" url="https://example.com/source" description="A supplied source." /><InlineCitationQuote>Quoted evidence.</InlineCitationQuote></InlineCitationCarouselItem></InlineCitationCarouselContent></InlineCitationCarousel></InlineCitationCardBody></InlineCitationCard></InlineCitation>);
    expect(screen.getByText("Evidence")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open citation/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Open citation/ }));
    expect(screen.getByRole("link", { name: "Example source" })).toHaveAttribute("href", "https://example.com/source");
    expect(screen.getByText("1/1")).toBeTruthy();
    expect(screen.getByText("Quoted evidence.")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("button", { name: /Open citation/ }), { key: "Escape" });
    expect(screen.queryByRole("link", { name: "Example source" })).toBeNull();
  });
});
