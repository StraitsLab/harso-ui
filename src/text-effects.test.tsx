import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MessageResponse, Shimmer } from "./text-effects";
import { AgentInstructions } from "./activity";
import { Reasoning, ReasoningContent } from "./work";

describe("runtime-free text effects", () => {
  test("Markdown renders GFM but never raw HTML, images or unsafe links", () => {
    const { container } = render(<MessageResponse>{'# A considered answer\n\n**Clear** and ~~brief~~.\n\n| Item | State |\n| --- | --- |\n| Brief | Ready |\n\n<script>alert(1)</script>\n\n<img src="https://private.example/tracker">\n\n![Private image](https://private.example/pixel)\n\n[bad](javascript:alert%281%29) [relative](/secret) [mail](mailto:private@example.com) [ftp](ftp://example.com/private) [good](https://example.com/research)'}</MessageResponse>);
    expect(screen.getByRole("heading", { name: "A considered answer" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("BriefReady");
    expect(container.querySelector("script, img, iframe")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/research");
    expect(screen.getByRole("link")).toHaveAttribute("rel", "noreferrer noopener");
    expect(container).toHaveTextContent("Private image");
  });
  test("semantic elements, refs, streaming and bounded shimmer tuning survive rerenders", () => {
    const response = createRef<HTMLDivElement>(); const shimmer = createRef<HTMLSpanElement>();
    const view = render(<><MessageResponse ref={response} streaming>## Evidence</MessageResponse><Shimmer as="h2" ref={shimmer} duration={NaN} spread={Infinity}>Working</Shimmer></>);
    expect(response.current).toHaveAttribute("aria-busy", "true");
    expect(shimmer.current).toBe(screen.getByRole("heading", { name: "Working" }));
    expect(shimmer.current?.style.getPropertyValue("--hk-shimmer-duration")).toBe("2s");
    expect(shimmer.current?.style.getPropertyValue("--hk-shimmer-spread")).toBe("20%");
    view.rerender(<><MessageResponse ref={response}>## Updated</MessageResponse><Shimmer as="h2" ref={shimmer} active={false} duration={-1} spread={100}>Done</Shimmer></>);
    expect(response.current).not.toHaveAttribute("aria-busy");
    expect(shimmer.current).not.toHaveAttribute("data-active");
    expect(shimmer.current?.style.getPropertyValue("--hk-shimmer-duration")).toBe("0.5s");
    expect(shimmer.current?.style.getPropertyValue("--hk-shimmer-spread")).toBe("80%");
    view.rerender(<Shimmer spread={-1}>Minimum</Shimmer>);
    expect(screen.getByText("Minimum").style.getPropertyValue("--hk-shimmer-spread")).toBe("5%");
  });
  test("activity and work render Markdown without a runtime provider", () => {
    render(<><AgentInstructions>**Instructions**</AgentInstructions><Reasoning defaultOpen><ReasoningContent>**Evidence**</ReasoningContent></Reasoning></>);
    expect(screen.getByText("Instructions", { selector: "strong" })).toBeVisible();
    expect(screen.getByText("Evidence", { selector: "strong" })).toBeVisible();
  });
});
