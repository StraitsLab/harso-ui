import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { schemaErrors, semanticErrors } from "../../scripts/check-output-playbook.mjs";
import schema from "../../docs/agent/schema/output-blocks.v1.json";
import { HarsoOutputCard, HARSO_OUTPUT_CARD_UNCAPPED, type HarsoOutputDocument } from "./output-card";

const credit = { label: "example.com", url: "https://example.com/place" };
const photo = { artifact: "https://example.com/photo.jpg", alt: "Garden", credit };
const media = { resolveArtifact: (value: string) => value };
const doc = (blocks: HarsoOutputDocument["blocks"]): HarsoOutputDocument => ({ kind: "output_blocks", major: 1, header: { title: "Garden" }, blocks, fallback_text: "Garden" });
afterEach(cleanup);

test("gallery caption follows the displayed photo and its host target", () => {
  const onOpenUrl = vi.fn();
  const second = { ...photo, artifact: "https://example.com/second.jpg", credit: { label: "other.com", url: "https://other.com/photo" } };
  render(<HarsoOutputCard onViewAll={() => {}} document={doc([{ kind: "visual", visual: { kind: "image", ...photo, images: [photo, second] } }])} media={media} onOpenUrl={onOpenUrl} />);
  expect(screen.getByRole("button", { name: "Photo · example.com" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
  expect(screen.queryByText("Photo · example.com")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Photo · other.com" }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith(second.credit.url);
});

test("small thumbnail credit waits for the full card, including registered place families", () => {
  const document = doc([{ kind: "rows", items: [{ label: "Garden", thumbnail: photo }] }]);
  const onOpenUrl = vi.fn();
  const { rerender } = render(<HarsoOutputCard onViewAll={() => {}} document={document} media={media} onOpenUrl={onOpenUrl} mode="inline" />);
  expect(screen.queryByText(/^Photo ·/)).toBeNull();
  rerender(<HarsoOutputCard onViewAll={() => {}} document={document} media={media} onOpenUrl={onOpenUrl} mode="full" caps={HARSO_OUTPUT_CARD_UNCAPPED} />);
  fireEvent.click(screen.getByRole("button", { name: "Photo · example.com" }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith(credit.url);
  rerender(<HarsoOutputCard onViewAll={() => {}} document={{ ...document, template: "places-nearby" }} media={media} onOpenUrl={onOpenUrl} mode="full" />);
  expect(screen.getByRole("button", { name: "Photo · example.com" })).toBeVisible();
});

test("price-watch hero keeps its source credit in the registered family", () => {
  const document = { ...doc([{ kind: "rows", items: [{ label: "Shop", trailing: "$10" }] }, { kind: "visual", visual: { kind: "image", ...photo } }]), template: "price-watch" };
  render(<HarsoOutputCard onViewAll={() => {}} document={document} media={media} onOpenUrl={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Photo · example.com" })).toBeVisible();
});

test("trip fallback keeps text thumbnail credits in the full card", () => {
  const document = { ...doc([
    { kind: "text", sections: [{ heading: "Day 1 · Garden", thumbnail: { ...photo, artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000001" }, bullets: ["Walk"] }] },
    { kind: "numbers", items: [{ label: "Days", value: "1" }, { label: "Stops", value: "1" }] },
  ]), template: "trip-itinerary" };
  expect(schemaErrors(schema, document)).toEqual([]);
  expect(semanticErrors(document)).toEqual([]);
  const onOpenUrl = vi.fn();
  const { container } = render(<HarsoOutputCard onViewAll={() => {}} document={document} media={media} onOpenUrl={onOpenUrl} mode="full" caps={HARSO_OUTPUT_CARD_UNCAPPED} />);
  expect(container.querySelector(".hkc-trip")).toBeNull();
  expect(screen.getByText("Days")).toBeVisible();
  expect(screen.getByRole("img", { name: "Garden" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Photo · example.com" }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith(credit.url);
});

test("trip day hero shows its source below the photo", () => {
  const document = { ...doc([{ kind: "text", sections: [{ heading: "Day 1 · Garden", thumbnail: photo, bullets: ["Walk"] }] }]), template: "trip-itinerary" };
  render(<HarsoOutputCard onViewAll={() => {}} document={document} media={media} onOpenUrl={vi.fn()} mode="full" />);
  expect(screen.getAllByRole("button", { name: "Photo · example.com" })).toHaveLength(1);
});

test("hero credit opens only through the host, and no credit preserves the original frame", () => {
  const onOpenUrl = vi.fn();
  const document = doc([{ kind: "visual", visual: { kind: "image", ...photo } }]);
  const { container, rerender } = render(<HarsoOutputCard onViewAll={() => {}} document={document} media={media} onOpenUrl={onOpenUrl} />);
  const caption = screen.getByRole("button", { name: "Photo · example.com" });
  expect(caption).toHaveAttribute("title", credit.url);
  expect(container.querySelector("a")).toBeNull();
  fireEvent.click(caption);
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith(credit.url);
  const bare = doc([{ kind: "visual", visual: { kind: "image", artifact: photo.artifact, alt: photo.alt } }]);
  rerender(<HarsoOutputCard onViewAll={() => {}} document={bare} media={media} onOpenUrl={onOpenUrl} />);
  expect(screen.queryByText(/^Photo ·/)).toBeNull();
  expect(screen.getByRole("img").parentElement).toHaveClass("hkc-output-media");
});
