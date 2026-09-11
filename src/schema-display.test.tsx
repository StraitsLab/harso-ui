import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SchemaDisplay, SchemaDisplayExample, SchemaDisplayRequest, SchemaDisplayProperty, SchemaDisplayParameters } from "./schema-display";

describe("SchemaDisplay", () => {
  it("preserves example content as inert text and composes nested array properties", () => {
    const view = render(<SchemaDisplay method="POST" path="/events"><SchemaDisplayRequest open><SchemaDisplayProperty schemaProperty={{ name: "events", type: "array", required: true, items: { name: "event", type: "object", properties: [{ name: "id", type: "string" }] } }} /><SchemaDisplayExample>{'<script>notExecuted()</script>'}</SchemaDisplayExample></SchemaDisplayRequest></SchemaDisplay>);
    expect(screen.getByText('<script>notExecuted()</script>')).toBeVisible();
    expect(view.container.querySelector("script")).toBeNull();
    expect(screen.getByText("id")).toBeVisible();
    expect(screen.getByLabelText("Required")).toBeVisible();
    view.rerender(<SchemaDisplayParameters open parameters={[]} />);
    expect(screen.getByText("0")).toBeVisible();
  });
  it("renders method, path, parameters, and nested properties", () => {
    render(<SchemaDisplay method="GET" path="/users/{id}" parameters={[{ name: "id", type: "string", required: true, location: "path" }]} responseBody={[{ name: "user", type: "object", properties: [{ name: "name", type: "string" }] }]} />);
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByLabelText("/users/{id}")).toBeInTheDocument();
    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
  });
});
