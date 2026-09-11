import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Conversation, ConversationContent, ConversationDownload, ConversationEmptyState, Message, MessageAction, MessageBranch, MessageBranchContent, MessageBranchNext, MessageBranchPage, MessageBranchPrevious, MessageBranchSelector, MessageResponse, Shimmer, Suggestion, Suggestions, messagesToMarkdown } from "./conversation";

describe("boundaryless conversation", () => {
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

  test("export is explicit and formats only supplied text without hidden transport data", () => {
    const download = vi.fn();
    const messages = [{ role: "user", content: "First question" }, { role: "assistant", content: "**Answer**" }] as const;
    render(<ConversationDownload messages={messages} onDownload={download} />);
    expect(download).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Download conversation" }));
    expect(download).toHaveBeenCalledExactlyOnceWith("## user\n\nFirst question\n\n## assistant\n\n**Answer**");
    expect(messagesToMarkdown(messages, (message, index) => `${index}: ${message.content}`)).toBe("0: First question\n\n1: **Answer**");
  });

  test("branch requests respect controlled refusal and empty or reduced branch counts", () => {
    const request = vi.fn();
    const branch = (items: string[]) => <MessageBranch branch={9} onBranchChange={request}><MessageBranchContent>{items.map(item => <p key={item}>{item}</p>)}</MessageBranchContent><MessageBranchSelector><MessageBranchPrevious /><MessageBranchPage /><MessageBranchNext /></MessageBranchSelector></MessageBranch>;
    const view = render(branch(["One", "Two", "Three"]));
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous response" }));
    expect(request).toHaveBeenCalledWith(1);
    expect(screen.getByText("Three")).toBeVisible();
    expect(screen.getByText("Two")).not.toBeVisible();
    view.rerender(branch(["One"]));
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous response" })).toBeDisabled();
    view.rerender(branch([]));
    expect(screen.getByText("0 of 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next response" })).toBeDisabled();
  });

  test("uncontrolled branches keep keyed drafts mounted while switching", () => {
    render(<MessageBranch><MessageBranchContent><label key="first">Notes<input aria-label="First draft" /></label><p key="second">Second answer</p></MessageBranchContent><MessageBranchSelector><MessageBranchPrevious /><MessageBranchPage /><MessageBranchNext /></MessageBranchSelector></MessageBranch>);
    const draft = screen.getByRole("textbox", { name: "First draft" });
    fireEvent.change(draft, { target: { value: "Do not lose this" } });
    fireEvent.click(screen.getByRole("button", { name: "Next response" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Previous response" }));
    expect(screen.getByRole("textbox")).toBe(draft);
    expect(draft).toHaveValue("Do not lose this");
  });

  test("suggestions and actions only invoke host callbacks and cannot submit a form", () => {
    const submit = vi.fn();
    const select = vi.fn();
    const action = vi.fn();
    render(<form onSubmit={submit}><Suggestions><Suggestion suggestion="Make it shorter" onSelect={select} /><Suggestion suggestion="Unavailable" disabled onSelect={select} /></Suggestions><MessageAction label="Retry answer" onClick={action}>Retry</MessageAction></form>);
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Make it shorter" }));
    fireEvent.click(screen.getByRole("button", { name: "Unavailable" }));
    fireEvent.click(screen.getByRole("button", { name: "Retry answer" }));
    expect(select).toHaveBeenCalledExactlyOnceWith("Make it shorter");
    expect(action).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
  });

  test("semantic response labels, native refs and finite shimmer tuning remain usable", () => {
    const root = createRef<HTMLDivElement>();
    const viewport = createRef<HTMLDivElement>();
    render(<Conversation ref={root}><ConversationContent ref={viewport}><Message from="assistant" label="Harso"><Shimmer as="h2" duration={NaN} spread={Infinity}>Working from the evidence</Shimmer></Message><ConversationEmptyState title="Begin here" description="A quiet space." /></ConversationContent></Conversation>);
    expect(root.current).toHaveClass("hk-conversation");
    expect(viewport.current).toHaveAttribute("role", "log");
    expect(screen.getByRole("article", { name: "Harso" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Working from the evidence" }).style.cssText).not.toMatch(/NaN|Infinity/);
  });
});
