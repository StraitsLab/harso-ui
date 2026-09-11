import type { ComponentPropsWithRef, ReactNode } from "react";

export type JSXPreviewProps = Omit<ComponentPropsWithRef<"div">, "onError"> & { jsx: string; isStreaming?: boolean; components?: Record<string, unknown>; bindings?: Record<string, unknown>; onError?: (error: Error) => void };
export function JSXPreview({ jsx, isStreaming = false, components, bindings, onError, className = "", children, ...props }: JSXPreviewProps) {
  const unsupported = components !== undefined || bindings !== undefined || onError !== undefined;
  return <div {...props} className={`hk-jsx-preview ${className}`} aria-busy={isStreaming || undefined} data-streaming={isStreaming || undefined}>
    {unsupported && <JSXPreviewError>JSX source is not executed; components, bindings, and onError are unsupported. Pass trusted, host-rendered children instead.</JSXPreviewError>}
    {children ?? (jsx.trim() ? <pre><code>{jsx}</code></pre> : <p role="status">{isStreaming ? "Waiting for JSX" : "No JSX supplied"}</p>)}
  </div>;
}
export function JSXPreviewContent({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-jsx-preview-content ${className}`} />; }
export function JSXPreviewError({ children, error, className = "", ...props }: Omit<ComponentPropsWithRef<"div">, "children"> & { children?: ReactNode | ((error: Error) => ReactNode); error?: Error }) { const content = typeof children === "function" ? children(error ?? new Error("JSX preview failed")) : children; return <div {...props} role="alert" className={`hk-jsx-preview-error ${className}`}>{content ?? "Unable to render preview."}</div>; }
export const JsxPreview = JSXPreview;
