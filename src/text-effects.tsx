import { type ComponentPropsWithRef, type CSSProperties, type ElementType } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
type DivProps = ComponentPropsWithRef<"div">;

export function MessageResponse({ children, streaming = false, className = "", ...props }: Omit<DivProps, "children" | "dangerouslySetInnerHTML"> & { children: string; streaming?: boolean }) {
  return <div {...props} className={`hk-message-response ${className}`} aria-busy={streaming || undefined} data-streaming={streaming || undefined}><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
    a: ({ href, children: content }) => {
      let safe: string | undefined;
      try { const url = new URL(href ?? ""); if (url.protocol === "http:" || url.protocol === "https:") safe = url.href; } catch { safe = undefined; }
      return safe ? <a href={safe} target="_blank" rel="noreferrer noopener">{content}</a> : <span>{content}</span>;
    },
    img: ({ alt }) => <span className="hk-message-image-label">{alt ? `Image: ${alt}` : "Image omitted"}</span>,
    input: ({ checked }) => <input type="checkbox" checked={!!checked} disabled aria-label={checked ? "Completed task" : "Incomplete task"} />,
  }}>{children}</Markdown></div>;
}

export function Shimmer({ as: Element = "span", active = true, duration = 2, spread = 2, className = "", style, ...props }: ComponentPropsWithRef<"span"> & { as?: ElementType; active?: boolean; duration?: number; spread?: number }) {
  return <Element {...props} className={`hk-shimmer ${className}`} data-active={active || undefined} style={{ ...style, "--hk-shimmer-duration": `${Number.isFinite(duration) ? Math.max(.5, duration) : 2}s`, "--hk-shimmer-spread": `${Number.isFinite(spread) ? Math.max(5, Math.min(80, spread * 10)) : 20}%` } as CSSProperties} />;
}
