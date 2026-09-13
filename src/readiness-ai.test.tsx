import { useState } from "react";
import { act, cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantRuntimeProvider, useLocalRuntime, type ThreadMessage } from "@assistant-ui/react";
import { HarsoComposer } from "./chat/composer";
import { attachments } from "./chat/testing/scripted-adapter";
import * as Queue from "./queue";
import { Checkpoint, CheckpointIcon, CheckpointTrigger } from "./work";
import { Confirmation, ConfirmationTitle, ConfirmationRequest, ConfirmationActions, ConfirmationAction, ConfirmationAccepted, ConfirmationRejected } from "./confirmation";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("WEV-1492 AI readiness composition", () => {
  it("submits runtime attachments into actionable queue files and images", async () => {
    const submitted = vi.fn();
    const remove = vi.fn(attachments.remove);
    let runtime: ReturnType<typeof useLocalRuntime>;
    function Host() {
      const [message, setMessage] = useState<ThreadMessage>();
      runtime = useLocalRuntime({ async *run({ messages }) { const value = messages.at(-1)!; submitted(value); setMessage(value); yield { content: [{ type: "text", text: "Queued" }] }; } }, { adapters: { attachments: { ...attachments, remove } } });
      return <AssistantRuntimeProvider runtime={runtime}><HarsoComposer /><button onClick={() => setMessage(undefined)}>Clear queue</button>
        <Queue.Queue aria-label="Submitted queue"><Queue.QueueList>{message && <Queue.QueueItem>
          <Queue.QueueItemContent>{message.content.filter(p => p.type === "text").map(p => p.text).join("")}</Queue.QueueItemContent>
          {message.attachments?.map(file => <Queue.QueueItemAttachment key={file.id}>{file.type === "image" ? <Queue.QueueItemImage src={String(file.content.find(p => p.type === "image")?.image)} alt={file.name} /> : <Queue.QueueItemFile name={file.name} />}</Queue.QueueItemAttachment>)}
          <Queue.QueueItemActions><Queue.QueueItemAction onClick={() => setMessage(undefined)}>Remove queued message</Queue.QueueItemAction></Queue.QueueItemActions>
        </Queue.QueueItem>}</Queue.QueueList></Queue.Queue>
      </AssistantRuntimeProvider>;
    }
    render(<Host />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await act(async () => {
      await runtime!.thread.composer.addAttachment(new File(["brief"], "brief.md", { type: "text/markdown" }));
      await runtime!.thread.composer.addAttachment(new File(["image"], "scene.png", { type: "image/png" }));
    });
    expect(screen.getByText("brief.md")).toBeVisible();
    expect(screen.getByRole("img", { name: "scene.png" })).toHaveAttribute("src", "data:image/png;base64,aW1hZ2U=");
    await userEvent.type(screen.getByRole("textbox"), "Review these files");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(submitted).toHaveBeenCalledOnce());
    const queue = screen.getByLabelText("Submitted queue");
    expect(within(queue).getByRole("listitem")).toHaveTextContent("Review these files");
    expect(within(queue).getByText("brief.md")).toBeVisible();
    expect(within(queue).getByRole("img", { name: "scene.png" })).toHaveAttribute("src", "data:image/png;base64,aW1hZ2U=");
    // Runtime consumes accepted attachments; unlike the retired store, it does not retain sent files in the draft.
    expect(runtime!.thread.composer.getState().attachments).toHaveLength(0);
    await userEvent.click(within(queue).getByRole("button", { name: "Remove queued message" }));
    expect(within(queue).queryByRole("listitem")).toBeNull();
    await act(async () => { await runtime!.thread.composer.addAttachment(new File(["again"], "again.txt", { type: "text/plain" })); });
    await userEvent.click(screen.getByRole("button", { name: "Remove again.txt" }));
    expect(remove).toHaveBeenCalledOnce();
    expect(runtime!.thread.composer.getState().attachments).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Clear queue" }));
    expect(within(queue).queryByRole("listitem")).toBeNull();
  });

  // Phase D retires prompt-only tabs/command anatomy, not Queue or Confirmation.
  it.each([true, false])("checkpoint review leads to titled host confirmation, approved=%s", async approved => {
    const request = vi.fn();
    function Host() {
      const [review, setReview] = useState(false);
      const [decision, setDecision] = useState<boolean>();
      return <><Checkpoint><CheckpointIcon data-testid="checkpoint-icon">◇</CheckpointIcon><CheckpointTrigger onClick={() => { request(); setReview(true); }}>Review before launch</CheckpointTrigger></Checkpoint>
        {review && <Confirmation approval={{ id: "review", approved: decision }} state={decision === undefined ? "approval-requested" : "approval-responded"} aria-labelledby="review-title">
          <ConfirmationTitle id="review-title">Review history point</ConfirmationTitle><ConfirmationRequest>Host approval required</ConfirmationRequest>
          <ConfirmationActions><ConfirmationAction onClick={() => setDecision(true)}>Approve</ConfirmationAction><ConfirmationAction onClick={() => setDecision(false)}>Reject</ConfirmationAction></ConfirmationActions>
          <ConfirmationAccepted>Host accepted</ConfirmationAccepted><ConfirmationRejected>Host rejected</ConfirmationRejected>
        </Confirmation>}
      </>;
    }
    render(<Host />);
    expect(screen.queryByRole("heading", { name: "Review history point" })).toBeNull();
    expect(screen.getByTestId("checkpoint-icon")).toHaveAttribute("aria-hidden", "true");
    await userEvent.click(screen.getByTestId("checkpoint-icon"));
    expect(request).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Review before launch" }));
    expect(request).toHaveBeenCalledOnce();
    expect(screen.getByRole("region", { name: "Review history point" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Review history point", level: 3 })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: approved ? "Approve" : "Reject" }));
    expect(screen.getByText(approved ? "Host accepted" : "Host rejected")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByText("Host approval required")).toBeNull();
    expect(request).toHaveBeenCalledOnce();
  });
});
