export const chatCatalog = [
  {
    id: "harso:chat-thread",
    name: "Conversation thread",
    description: "Streaming messages, edit-in-place, branches, clipboard, feedback, and read aloud.",
    exports: ["HarsoThread", "HarsoUserMessage", "HarsoAssistantMessage", "HarsoEditComposer", "HarsoMessageActions"],
  },
  {
    id: "harso:chat-composer",
    name: "Conversation composer",
    description: "Runtime-owned draft, send/stop, attachments, and application-owned footer slots.",
    exports: ["HarsoComposer", "HarsoComposerAttachment", "HarsoMessageAttachment"],
  },
  {
    id: "harso:chat-parts",
    name: "Conversation parts",
    description: "Tool results, terminal and file output, approval, reasoning, errors, and stopped runs.",
    exports: ["HarsoToolCall", "HarsoToolState", "HarsoTerminalTool", "HarsoReadFileTool", "HarsoApproval", "HarsoReasoning", "HarsoMessageError", "HarsoStoppedRun", "harsoToolComponents"],
  },
  {
    id: "harso:chat-markdown",
    name: "Conversation Markdown",
    description: "Streaming GFM text, tables, links, and copyable code blocks with Harso styling.",
    exports: ["HarsoMarkdownText", "HarsoCodeBlock"],
  },
  {
    id: "harso:chat-shell",
    name: "Conversation workspace",
    description: "Responsive conversation navigation, header, transcript, composer, and context slots.",
    exports: ["HarsoChatShell", "HarsoThreadList"],
  },
] as const;
