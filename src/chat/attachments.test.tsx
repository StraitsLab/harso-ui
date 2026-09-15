import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime, type AttachmentAdapter } from "@assistant-ui/react";
import { HarsoComposer } from "./composer";
import { HarsoMessageAttachment } from "./attachments";

const image = "data:image/png;base64,aGVsbG8=";
const remove = vi.fn(async () => {});
const attachments: AttachmentAdapter = {
  accept: "*",
  async add({ file }) { return { id: file.name, name: file.name, file, type: file.type.startsWith("image/") ? "image" : "document", contentType: file.type, status: { type: "requires-action", reason: "composer-send" }, content: file.type.startsWith("image/") ? [{ type: "image", image }] : [] }; },
  async send(attachment) { return { ...attachment, status: { type: "complete" }, content: attachment.content ?? [] }; },
  remove,
};

function setup(disabled = false) {
  let runtime: ReturnType<typeof useLocalRuntime>;
  function UserMessage() { return <MessagePrimitive.Root><MessagePrimitive.Attachments components={{ Attachment: HarsoMessageAttachment }} /></MessagePrimitive.Root>; }
  function Harness() {
    runtime = useLocalRuntime({ async *run() { yield { content: [{ type: "text", text: "Received" }] }; } }, { adapters: { attachments } });
    return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage: () => null }} /><HarsoComposer disabled={disabled} /></AssistantRuntimeProvider>;
  }
  const view = render(<Harness />);
  return { ...view, runtime: () => runtime! };
}

describe("Harso attachments", () => {
  beforeEach(() => remove.mockClear());

  it("adds through the primitive file picker and removes through the adapter", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(["hello"], "notes.txt", { type: "text/plain" })] } });
    expect(await screen.findByText("notes.txt")).toBeVisible();
    expect(screen.getByText("5 B")).toBeVisible();
    const chip = screen.getByText("notes.txt").closest(".hkc-attachment");
    expect(chip).toHaveClass("hkc-attachment--composer");
    expect(chip?.closest(".hkc-composer-attachments")).not.toBeNull();
    expect(chip?.closest("fieldset")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove notes.txt" }));
    await waitFor(() => expect(screen.queryByText("notes.txt")).not.toBeInTheDocument());
    expect(remove).toHaveBeenCalledOnce();
  });

  it("pastes an image, displays its thumbnail and sends it inside the user message", async () => {
    const harness = setup();
    fireEvent.paste(screen.getByRole("textbox"), { clipboardData: { files: [new File([new Uint8Array(2048)], "layout.png", { type: "image/png" })] } });
    expect(await screen.findByRole("img", { name: "layout.png" })).toHaveAttribute("src", image);
    expect(screen.getByText("2.0 KB")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(harness.runtime().thread.getState().messages[0]?.attachments).toHaveLength(1));
    expect(screen.getByRole("img", { name: "layout.png" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Remove layout.png" })).not.toBeInTheDocument();
  });

  it("accepts dropped files and preserves the primitive dragging attribute", async () => {
    const { container } = setup();
    const dropzone = container.querySelector(".hkc-composer-dock")!;
    const dataTransfer = { types: ["Files"], files: [new File([new Uint8Array(1048576)], "large.txt", { type: "text/plain" })] };
    fireEvent.dragEnter(dropzone, { dataTransfer });
    expect(dropzone).toHaveAttribute("data-dragging", "true");
    fireEvent.drop(dropzone, { dataTransfer });
    expect(await screen.findByText("large.txt")).toBeVisible();
    expect(screen.getByText("1.0 MB")).toBeVisible();
    expect(dropzone).not.toHaveAttribute("data-dragging");
  });

  it("blocks disabled drops and attachment removal", async () => {
    const harness = setup(true);
    await act(async () => { await harness.runtime().thread.composer.addAttachment(new File([], "retained.txt")); });
    expect(screen.getByRole("button", { name: "Remove retained.txt" })).toBeDisabled();
    fireEvent.drop(harness.container.querySelector(".hkc-composer-dock")!, { dataTransfer: { types: ["Files"], files: [new File([], "blocked.txt")] } });
    fireEvent.paste(screen.getByRole("textbox"), { clipboardData: { files: [new File([], "blocked.png", { type: "image/png" })] } });
    expect(harness.runtime().thread.composer.getState().attachments).toHaveLength(1);
  });
});
