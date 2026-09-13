import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentLimitsCard, AgentProgress, AgentThinking, TaskList, WebSearch } from "./agent-surfaces";

describe("agent surfaces", () => {
  it("renders host-fed progress and interactions", () => {
    render(<><AgentLimitsCard used={20} maximum={100} /><AgentProgress steps={["Plan", "Build"]} current={1} /><AgentThinking /><TaskList tasks={[{ id: "1", label: "Done", status: "complete" }]} /><WebSearch query="harso" searchResults={[{ title: "Harso", url: "https://example.com" }]} /></>);
    expect(screen.getByText("Harso")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
