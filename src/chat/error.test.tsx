import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime, type ChatModelAdapter, type ThreadMessageLike } from "@assistant-ui/react";
import { HarsoMessageError, HarsoStoppedRun } from "./error";

function Message() { return <MessagePrimitive.Root><MessagePrimitive.Parts /><HarsoMessageError /><HarsoStoppedRun /></MessagePrimitive.Root>; }
function Harness({ adapter, status }: { adapter: ChatModelAdapter; status: ThreadMessageLike["status"] }) {
  const runtime = useLocalRuntime(adapter, { initialMessages: [{ role: "user", content: "Hello" }, { role: "assistant", content: "", status }] });
  return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ Message }} /></AssistantRuntimeProvider>;
}
test("Retry regenerates through ActionBarPrimitive.Reload", async () => {
  const run = vi.fn(async function* () { yield { content: [{ type: "text" as const, text: "Recovered" }] }; });
  render(<Harness adapter={{ run }} status={{ type: "incomplete", reason: "error", error: "Offline" }} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Offline");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(run).toHaveBeenCalledOnce());
  expect(await screen.findByText("Recovered")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});
test("cancelled runs show only the quiet stopped note", () => {
  render(<Harness adapter={{ async *run() {} }} status={{ type: "incomplete", reason: "cancelled" }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Stopped by you");
  expect(screen.queryByRole("alert")).toBeNull();
});
