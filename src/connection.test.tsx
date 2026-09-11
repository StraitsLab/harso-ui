import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Connection } from "./connection";

describe("Connection", () => {
  it("renders a themed bezier path and target marker", () => {
    const { container } = render(<Connection fromX={0} fromY={10} toX={100} toY={50} animated={false} />);
    expect(container.querySelector("path")).toHaveAttribute("d", expect.stringContaining("M 0 10"));
    expect(container.querySelector("circle")).toHaveAttribute("cx", "100");
  });
  it("names an informative connection and reflects host geometry updates", () => {
    const view = render(<Connection aria-label="Input to output" fromX={0} fromY={10} toX={100} toY={50} />);
    expect(screen.getByRole("img", { name: "Input to output" })).toBeInTheDocument();
    view.rerender(<Connection fromX={5} fromY={10} toX={200} toY={90} animated={false} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(view.container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(view.container.querySelector("path")).toHaveAttribute("d", expect.stringContaining("M 5 10"));
    expect(view.container.querySelector("circle")).toHaveAttribute("cx", "200");
    expect(view.container.querySelector("path")).not.toHaveClass("hk-connection-line--animated");
  });
});
