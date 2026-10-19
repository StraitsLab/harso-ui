import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, HARSO_OUTPUT_CARD_UNCAPPED, type HarsoOutputDocument } from "./output-card";
const photo = { artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000001", alt: "Kyoto" };
const media = { resolveArtifact: () => "https://photos.test/kyoto.jpg" };
afterEach(cleanup);
test("generic sections retain their date and photo after the inline fitting pass and in the whole answer", () => {
  const document: HarsoOutputDocument = { header: { title: "Trip" }, blocks: [{ kind: "text", sections: [{ heading: "Day one", date: "2026-10-20", thumbnail: photo, paragraphs: ["Visit the temple early."] }] }], fallback_text: "Fallback" };
  const view = render(<HarsoOutputCard document={document} media={media} />);
  expect(view.container.querySelector("time")?.getAttribute("datetime")).toBe("2026-10-20");
  expect(screen.getByAltText("Kyoto")).toBeTruthy();
  view.rerender(<HarsoOutputCard document={document} media={media} caps={HARSO_OUTPUT_CARD_UNCAPPED} />);
  expect(screen.getByAltText("Kyoto")).toBeTruthy();
});
test("generic rows preserve useful rating/category and execute only the supplied host action", () => {
  const open = vi.fn();
  render(<HarsoOutputCard document={{ header: { title: "Places" }, blocks: [{ kind: "rows", items: [{ label: "Temple", category: "Temple", rating: "4.6", review_count: 120, action: { kind: "open_url", label: "Directions", url: "https://www.openstreetmap.org" } }] }], fallback_text: "Fallback" }} onOpenUrl={open} />);
  expect(screen.getByText(/4.6/)).toBeVisible(); expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Directions" })); expect(open).toHaveBeenCalledWith("https://www.openstreetmap.org");
});
