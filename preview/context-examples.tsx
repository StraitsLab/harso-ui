import { useState } from "react";
import { Checkbox, Select, Context, ContextCacheUsage, ContextContent, ContextContentBody, ContextContentFooter, ContextContentHeader, ContextInputUsage, ContextOutputUsage, ContextReasoningUsage, ContextTrigger } from "@harso/ui";
import type { ExampleState } from "./examples";

export const contextExports = ["Context"] as const;
export type ContextExport = typeof contextExports[number];
export const contextNotes = { Context: { behavior: "Host-supplied context-window usage with an explicit disclosure. Token counts and cost are presentation data; no model or billing authority is added.", example: '<Context maxTokens={128000} usedTokens={32000} usage={usage}><ContextTrigger /><ContextContent>...</ContextContent></Context>' } };
export function ContextExample({ state }: { state: ExampleState }) {
  const [sample, setSample] = useState(state === "error" ? "error" : "ready");
  const [open, setOpen] = useState(false);
  const [hold, setHold] = useState(false);
  const [request, setRequest] = useState("No context request.");
  const available = sample === "ready" || sample === "replacement" || sample === "disabled";
  const usedTokens = !available ? NaN : sample === "replacement" ? 64000 : state === "long-content" ? 89000 : 32000;
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar" style={{ justifyContent: "flex-start", alignItems: "flex-start", gap: 16, flexDirection: "column" }}><label>Context sample<Select value={sample} onChange={event => setSample(event.target.value)}>{["ready", "empty", "loading", "error", "replacement", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label><Checkbox label="Hold context requests" checked={hold} onChange={event => setHold(event.target.checked)} /></div>
    <Context maxTokens={128000} usedTokens={usedTokens} modelId={available ? "qwen3-coder" : undefined} cost={available ? 0.0184 : undefined} usage={available ? { inputTokens: usedTokens - 9000, outputTokens: 7000, reasoningTokens: 4000, cachedInputTokens: 2000 } : undefined} open={open} onOpenChange={next => { setRequest(hold ? "Host declined context disclosure." : "Context disclosure accepted."); if (!hold) setOpen(next); }} aria-busy={sample === "loading"}>
      <ContextTrigger disabled={state === "disabled" || sample === "disabled"} /><ContextContent><ContextContentHeader /><ContextContentBody><ContextInputUsage /><ContextOutputUsage /><ContextReasoningUsage /><ContextCacheUsage /></ContextContentBody><ContextContentFooter /></ContextContent>
    </Context>
    <p role={sample === "error" ? "alert" : "status"}>Context sample: {sample}. {!available && (sample === "loading" ? "Waiting for host usage." : sample === "error" ? "Host usage unavailable." : "No usage supplied.")}</p><output aria-label="Context request">{request}</output>
  </div>;
}
