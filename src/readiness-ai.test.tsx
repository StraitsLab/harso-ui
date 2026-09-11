import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Prompt from "./prompt-input";
import * as Queue from "./queue";
import { Attachment, Attachments } from "./attachments";
import { Checkpoint, CheckpointIcon, CheckpointTrigger } from "./work";
import { Confirmation, ConfirmationTitle, ConfirmationRequest, ConfirmationActions, ConfirmationAction, ConfirmationAccepted, ConfirmationRejected } from "./confirmation";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("WEV-1492 AI readiness composition", () => {
  it("submits header attachments through body/footer tools into actionable queue files and images", async () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL(file: File) { return `blob:${file.name}`; }
      static revokeObjectURL = revoke;
    });
    const submitted = vi.fn();
    function DraftAttachments() {
      const attachments = Prompt.usePromptInputAttachments();
      return <Attachments variant="inline">{attachments.files.map(file => <Attachment key={file.id} data={{ id: file.id, name: file.filename, url: file.url, mediaType: file.mediaType }} onRemove={() => attachments.remove(file.id)} />)}</Attachments>;
    }
    function Host() {
      const [message, setMessage] = useState<Prompt.PromptInputMessage>();
      return <><Prompt.PromptInput onSubmitMessage={value => { submitted(value); setMessage(value); }}>
        <Prompt.PromptInputHeader aria-label="Draft attachments"><DraftAttachments /></Prompt.PromptInputHeader>
        <Prompt.PromptInputBody><Prompt.PromptInputTextarea aria-label="Draft" /></Prompt.PromptInputBody>
        <Prompt.PromptInputFooter><Prompt.PromptInputTools><Prompt.PromptInputActionAddAttachments /><Prompt.PromptInputButton onClick={() => setMessage(undefined)}>Clear queue</Prompt.PromptInputButton></Prompt.PromptInputTools><Prompt.PromptInputSubmit /></Prompt.PromptInputFooter>
      </Prompt.PromptInput>
      <Queue.Queue aria-label="Submitted queue"><Queue.QueueList>{message && <Queue.QueueItem>
        <Queue.QueueItemContent>{message.text}</Queue.QueueItemContent>
        {message.files.map(file => <Queue.QueueItemAttachment key={file.id}>{file.mediaType.startsWith("image/") ? <Queue.QueueItemImage src={file.url} alt={file.filename} /> : <Queue.QueueItemFile name={file.filename} />}</Queue.QueueItemAttachment>)}
        <Queue.QueueItemActions><Queue.QueueItemAction onClick={() => setMessage(undefined)}>Remove queued message</Queue.QueueItemAction></Queue.QueueItemActions>
      </Queue.QueueItem>}</Queue.QueueList></Queue.Queue></>;
    }
    const user = userEvent.setup();
    const view = render(<Host />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await user.upload(screen.getByRole("button", { name: "Attach" }).previousElementSibling as HTMLInputElement, [new File(["brief"], "brief.md", { type: "text/markdown" }), new File(["image"], "scene.png", { type: "image/png" })]);
    const header = screen.getByLabelText("Draft attachments");
    expect(within(header).getByText("brief.md")).toBeVisible();
    expect(within(header).getByRole("img", { name: "scene.png" })).toHaveAttribute("src", "blob:scene.png");
    await user.type(screen.getByRole("textbox", { name: "Draft" }), "Review these files");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(submitted).toHaveBeenCalledExactlyOnceWith({ text: "Review these files", files: [expect.objectContaining({ filename: "brief.md", mediaType: "text/markdown", url: "blob:brief.md" }), expect.objectContaining({ filename: "scene.png", mediaType: "image/png", url: "blob:scene.png" })] });
    const queue = screen.getByLabelText("Submitted queue");
    expect(within(queue).getByRole("listitem")).toHaveTextContent("Review these files");
    expect(within(queue).getByText("brief.md")).toBeVisible();
    expect(within(queue).getByRole("img", { name: "scene.png" })).toHaveAttribute("src", "blob:scene.png");
    await user.click(within(queue).getByRole("button", { name: "Remove queued message" }));
    expect(within(queue).queryByRole("listitem")).toBeNull();
    expect(within(header).getByText("brief.md")).toBeVisible();
    await user.click(within(within(header).getByLabelText("brief.md")).getByRole("button", { name: /^Remove$/ }));
    expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:brief.md");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(submitted.mock.lastCall?.[0].files.map((file: Prompt.PromptInputFile) => file.filename)).toEqual(["scene.png"]);
    await user.click(screen.getByRole("button", { name: "Clear queue" }));
    expect(within(queue).queryByRole("listitem")).toBeNull();
    view.unmount();
    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenLastCalledWith("blob:scene.png");
  });

  it("tab labels select retained prompt panels and command separators never become actions", async () => {
    const selected = vi.fn();
    render(<Prompt.PromptInputTabsList defaultValue="write">
      <Prompt.PromptInputTab value="write" label={<Prompt.PromptInputTabLabel>Write</Prompt.PromptInputTabLabel>}><input aria-label="Retained draft" defaultValue="Keep this" /></Prompt.PromptInputTab>
      <Prompt.PromptInputTab value="actions" label={<Prompt.PromptInputTabLabel>Actions</Prompt.PromptInputTabLabel>}><Prompt.PromptInputCommand>
        <Prompt.PromptInputCommandInput aria-label="Find command" />
        <Prompt.PromptInputCommandList><Prompt.PromptInputCommandItem value="first" onSelect={selected}>First</Prompt.PromptInputCommandItem><Prompt.PromptInputCommandSeparator /><Prompt.PromptInputCommandItem value="last" onSelect={selected}>Last</Prompt.PromptInputCommandItem></Prompt.PromptInputCommandList>
      </Prompt.PromptInputCommand></Prompt.PromptInputTab>
    </Prompt.PromptInputTabsList>);
    await userEvent.click(screen.getByRole("tab", { name: "Actions" }));
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("separator")).toBeVisible();
    const input = screen.getByRole("combobox", { name: "Find command" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(selected).toHaveBeenCalledExactlyOnceWith("last");
    await userEvent.click(screen.getByRole("tab", { name: "Write" }));
    expect(screen.getByRole("textbox", { name: "Retained draft" })).toHaveValue("Keep this");
  });

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
