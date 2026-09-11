import { useState } from "react";
import { Button, Checkbox, Terminal, TerminalActions, TerminalClearButton, TerminalContent, TerminalCopyButton, TerminalHeader, TerminalStatus, TerminalTitle } from "@harso/ui";
import type { ExampleState } from "./examples";
export const terminalExports = ["Terminal"] as const;
export type TerminalExport = typeof terminalExports[number];
export const terminalNotes = { Terminal: { behavior: "Host-supplied console output with inert ANSI presentation, optional streaming cursor, native auto-scroll, copy, and clear callbacks. No polling or execution authority.", example: '<Terminal output={output} isStreaming={streaming} onClear={clear}><TerminalHeader><TerminalTitle /><TerminalStatus /><TerminalActions><TerminalCopyButton /><TerminalClearButton /></TerminalActions></TerminalHeader><TerminalContent /></Terminal>' } };
export function TerminalExample({ state }: { state: ExampleState }) {
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState(state === "error" ? "error: supplied build failed" : "\x1b[32m✓\x1b[0m build complete\n\x1b[36minfo\x1b[0m ready");
  const [hold, setHold] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [request, setRequest] = useState("Supplied output only. No process started.");
  return <div className="hkl-example-stack"><div className="hk-data-toolbar">
    <Checkbox label="Streaming" checked={streaming} onChange={event => setStreaming(event.target.checked)} />
    <Checkbox label="Disable terminal controls" checked={disabled} onChange={event => setDisabled(event.target.checked)} />
    <Checkbox label="Hold clear requests" checked={hold} onChange={event => setHold(event.target.checked)} />
    <Button size="small" onClick={() => setOutput(value => `${value}\nnew output at ${new Date().toLocaleTimeString()}`)}>Append output</Button>
    <Button size="small" onClick={() => { setOutput("error: supplied build failed"); setStreaming(false); }}>Supply error output</Button>
    <Button size="small" onClick={() => { setOutput("replacement build complete"); setStreaming(false); }}>Replace output</Button>
  </div><Terminal output={output} isStreaming={streaming} disabled={disabled || state === "disabled"} onClear={() => { setRequest(hold ? "Clear requested. Host declined." : "Clear accepted locally."); if (!hold) setOutput(""); }}><TerminalHeader><TerminalTitle>Build log</TerminalTitle><TerminalStatus /><TerminalActions><TerminalCopyButton /><TerminalClearButton /></TerminalActions></TerminalHeader><TerminalContent /></Terminal><output aria-label="Terminal request">{request}</output></div>;
}
