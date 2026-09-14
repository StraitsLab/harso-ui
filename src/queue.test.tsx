import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Queue, QueueItem, QueueItemContent, QueueItemIndicator, QueueSection, QueueSectionTrigger } from "./queue";
import "./queue.css";

test("queue status stays title-aligned and disclosure has a decorative vector chevron", () => {
  const { container } = render(<div className="harso-kit"><Queue><QueueSection><QueueSectionTrigger>Work queue</QueueSectionTrigger><ul><QueueItem><QueueItemIndicator /><div><QueueItemContent>Title</QueueItemContent><p>Wrapping description</p></div></QueueItem></ul></QueueSection></Queue></div>);
  const status = screen.getByLabelText("Pending");
  expect(getComputedStyle(status).alignSelf).toBe("flex-start");
  expect(getComputedStyle(status).marginTop).toBe("2px");
  expect(container.querySelector("summary svg")).toHaveAttribute("aria-hidden", "true");
});
