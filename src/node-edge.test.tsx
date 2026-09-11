import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Edge } from "./edge";
import { Node, NodeAction, NodeContent, NodeDescription, NodeFooter, NodeHeader, NodeTitle } from "./node";

describe("Node and Edge", () => {
  it("renders composable graph presentation primitives", () => {
    const { container } = render(<><Node><NodeTitle>Task</NodeTitle><NodeContent>Output</NodeContent></Node><Edge.Temporary sourceX={0} sourceY={0} targetX={100} targetY={40} /></>);
    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(container.querySelector("path")).toHaveAttribute("d", expect.stringContaining("M 0 0"));
  });
  it("passes arrow markers to the path rather than assigning them as an id", () => {
    const { container } = render(<Edge.Animated sourceX={0} sourceY={0} targetX={100} targetY={40} markerEnd="url(#arrow)" />);
    expect(container.querySelector("path")).toHaveAttribute("marker-end", "url(#arrow)");
    expect(container.querySelector("path")).not.toHaveAttribute("id", "url(#arrow)");
  });
  it("composes every node slot and respects host handle visibility", () => {
    const view = render(<Node handles={{ source: true, target: false }} aria-label="Work"><NodeHeader><NodeTitle>Title</NodeTitle><NodeDescription>Description</NodeDescription><NodeAction><button disabled>Action</button></NodeAction></NodeHeader><NodeContent>Content</NodeContent><NodeFooter>Footer</NodeFooter></Node>);
    expect(screen.getByRole("article", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Title", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Description")).toHaveClass("hk-node-description");
    expect(screen.getByText("Footer")).toHaveClass("hk-node-footer");
    expect(screen.getByRole("button", { name: "Action" })).toBeDisabled();
    expect(view.container.querySelector(".hk-node-handle--target")).toBeNull();
    expect(view.container.querySelector(".hk-node-handle--source")).toHaveAttribute("aria-hidden", "true");
  });
});
