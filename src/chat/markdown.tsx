"use client";

import { MarkdownTextPrimitive, type SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import type { TextMessagePartProps } from "@assistant-ui/react";
import type { ComponentProps } from "react";
import remarkGfm from "remark-gfm";
import { HarsoCodeBlock } from "./code-block";
import "./markdown.css";

const components: ComponentProps<typeof MarkdownTextPrimitive>["components"] = {
  p: ({ node: _node, ...props }) => <p {...props} />,
  h1: ({ node: _node, ...props }) => <h1 {...props} />,
  h2: ({ node: _node, ...props }) => <h2 {...props} />,
  h3: ({ node: _node, ...props }) => <h3 {...props} />,
  ul: ({ node: _node, ...props }) => <ul {...props} />,
  ol: ({ node: _node, ...props }) => <ol {...props} />,
  code: ({ node: _node, ...props }) => <code {...props} />,
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  blockquote: ({ node: _node, ...props }) => <blockquote {...props} />,
  input: ({ node: _node, ...props }) => props.type === "checkbox" ? <input {...props} aria-label={props.checked ? "Completed task" : "Open task"} /> : <input {...props} />,
  table: ({ node: _node, ...props }) => <div className="hkc-markdown-table" role="region" aria-label="Table" tabIndex={0}><table {...props} /></div>,
  hr: ({ node: _node, ...props }) => <hr {...props} />,
  // Agent transcripts are untrusted: remote images never load (no request leaves the host); the alt text is kept as a label.
  img: ({ node: _node, alt }) => <span className="hkc-markdown-image-label">{alt ? `Image: ${alt}` : "Image omitted"}</span>,
  CodeHeader: () => null,
  SyntaxHighlighter: ({ code, language }: SyntaxHighlighterProps) => <HarsoCodeBlock code={code} language={language} />,
};

/** react-markdown already drops javascript:/data: hrefs; this makes the policy explicit and keeps only http(s), mailto and in-page links. */
const safeUrl = (url: string) => /^(https?:|mailto:|#|\/)/i.test(url) ? url : "";

export function HarsoMarkdownText(_props: Partial<TextMessagePartProps>) {
  return <MarkdownTextPrimitive className="hkc-markdown hkc-message-text" containerProps={{ "data-testid": "hkc-markdown" } as ComponentProps<typeof MarkdownTextPrimitive>["containerProps"]} remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl} smooth components={components} />;
}
