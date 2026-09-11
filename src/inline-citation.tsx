import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useState, type ComponentPropsWithRef, type ReactElement } from "react";
import { Button } from "./primitives";
import { Source } from "./activity";
import { AttachmentHoverCard, AttachmentHoverCardTrigger, AttachmentHoverCardContent } from "./attachments";

type CitationContextValue = { current: number; count: number; setCurrent: (value: number) => void; setCount: (value: number) => void };
const CitationContext = createContext<CitationContextValue | null>(null);
function useCitation() { const value = useContext(CitationContext); if (!value) throw new Error("Citation parts require InlineCitationCarousel."); return value; }

export function InlineCitation({ className = "", ...props }: ComponentPropsWithRef<"span">) { return <span {...props} className={`hk-inline-citation ${className}`} />; }
export function InlineCitationText({ className = "", ...props }: ComponentPropsWithRef<"span">) { return <span {...props} className={`hk-inline-citation-text ${className}`} />; }
export function InlineCitationCard({ children, className = "", ...props }: ComponentPropsWithRef<typeof AttachmentHoverCard>) { return <AttachmentHoverCard {...props} as="span" className={`hk-inline-citation-card ${className}`}>{children}</AttachmentHoverCard>; }
export function InlineCitationCardTrigger({ sources, className = "", children, ...props }: ComponentPropsWithRef<"button"> & { sources: string[] }) {
  let label = `${sources.length} sources`;
  if (sources.length === 1) { try { label = new URL(sources[0]).hostname || "Source unavailable"; } catch { label = "Source unavailable"; } }
  return <AttachmentHoverCardTrigger {...props} className={`hk-inline-citation-trigger ${className}`} aria-label={`Open citation: ${label}`}><span aria-hidden="true">[{sources.length || "?"}]</span>{children}</AttachmentHoverCardTrigger>;
}
export function InlineCitationCardBody({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <AttachmentHoverCardContent {...props} className={`hk-inline-citation-card-body ${className}`} />; }
export function InlineCitationCarousel({ children, className = "", ...props }: ComponentPropsWithRef<"div">) {
  const [current, setCurrent] = useState(0), [count, setCount] = useState(0);
  useEffect(() => { setCurrent(previous => Math.min(previous, Math.max(0, count - 1))); }, [count]);
  return <CitationContext value={{ current, count, setCount, setCurrent: value => setCurrent(Math.max(0, Math.min(value, Math.max(0, count - 1)))) }}><div {...props} className={`hk-inline-citation-carousel ${className}`}>{children}</div></CitationContext>;
}
export function InlineCitationCarouselContent({ children, className = "", ...props }: ComponentPropsWithRef<"div">) { const { setCount } = useCitation(); const items = Children.toArray(children); useEffect(() => setCount(items.length), [items.length, setCount]); return <div {...props} className={`hk-inline-citation-carousel-content ${className}`}>{items.map((item, index) => isValidElement(item) ? cloneElement(item as ReactElement<{ index?: number }>, { index, key: index }) : item)}</div>; }
export function InlineCitationCarouselItem({ children, index = 0, className = "", ...props }: ComponentPropsWithRef<"div"> & { index?: number }) {
  const { current } = useCitation();
  return <div {...props} hidden={index !== current} className={`hk-inline-citation-carousel-item ${className}`} data-active={index === current || undefined}>{children}</div>;
}
export function InlineCitationCarouselHeader({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-inline-citation-carousel-header ${className}`} />; }
export function InlineCitationCarouselIndex({ children, className = "", ...props }: ComponentPropsWithRef<"div">) { const { current, count } = useCitation(); return <div {...props} aria-live="polite" className={`hk-inline-citation-carousel-index ${className}`}>{children ?? `${count ? current + 1 : 0}/${count}`}</div>; }
export function InlineCitationCarouselPrev({ className = "", ...props }: ComponentPropsWithRef<typeof Button>) { const { current, setCurrent } = useCitation(); return <Button {...props} type="button" size="small" className={`hk-inline-citation-carousel-button ${className}`} aria-label="Previous citation" disabled={current === 0 || props.disabled} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) setCurrent(current - 1); }}>‹</Button>; }
export function InlineCitationCarouselNext({ className = "", ...props }: ComponentPropsWithRef<typeof Button>) { const { current, count, setCurrent } = useCitation(); return <Button {...props} type="button" size="small" className={`hk-inline-citation-carousel-button ${className}`} aria-label="Next citation" disabled={current >= count - 1 || props.disabled} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) setCurrent(current + 1); }}>›</Button>; }
export function InlineCitationSource({ title, url, description, className = "", ...props }: ComponentPropsWithRef<"div"> & { title: string; url: string; description?: string }) { return <div {...props} className={`hk-inline-citation-source ${className}`}><Source href={url}>{title}</Source>{description && <p>{description}</p>}</div>; }
export function InlineCitationQuote({ className = "", ...props }: ComponentPropsWithRef<"blockquote">) { return <blockquote {...props} className={`hk-inline-citation-quote ${className}`} />; }
