import { useRef, useState } from "react";
import { AiImageGeneration, Button, Checkbox, Composer, Conversation, ConversationContent, Dropdown, DropdownItem, DropdownPopover, DropdownTrigger, Image, Message, MessageContent, MessageResponse, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, Select, Snippet, SnippetCopyButton, type AiImageGenerationProps } from "@harso/ui";
import type { ExampleState } from "./examples";

type Generation = { id: string; agent: string; prompt: string; state: NonNullable<AiImageGenerationProps["state"]>; remaining?: number; src?: string; model: string; style: string; aspect: string; references: string[] };
const agents = ["Image artist", "Product studio"];
export function sampleImage(index: number, aspect = "Landscape") {
  const height = aspect === "Portrait" ? 780 : aspect === "Square" ? 600 : 400;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}"><rect width="600" height="${height}" fill="${index % 2 ? "#ded9cc" : "#dbe4df"}"/><circle cx="430" cy="110" r="65" fill="#faf6e9"/><path d="M0 ${height * .65} Q160 ${height * .3} 300 ${height * .65} T600 ${height * .5} V${height} H0Z" fill="${index % 2 ? "#9a8c7d" : "#748b83"}"/><path d="M0 ${height * .9} Q230 ${height * .55} 600 ${height * .9} V${height} H0Z" fill="${index % 2 ? "#655c55" : "#415b54"}"/></svg>`)}`;
}
const initialGenerations: Generation[] = [
  { id: "sample-1", agent: agents[0], prompt: "A quiet horizon", state: "complete", src: sampleImage(0), model: "Illustration", style: "Soft", aspect: "Landscape", references: [] },
  { id: "sample-2", agent: agents[0], prompt: "Warm morning light", state: "complete", src: sampleImage(1, "Portrait"), model: "Illustration", style: "Soft", aspect: "Portrait", references: [] },
  { id: "sample-3", agent: agents[0], prompt: "A square of stillness", state: "complete", src: sampleImage(2, "Square"), model: "Illustration", style: "Soft", aspect: "Square", references: [] },
  { id: "sample-4", agent: agents[0], prompt: "Evening dunes", state: "complete", src: sampleImage(3), model: "Illustration", style: "Soft", aspect: "Landscape", references: [] },
];

export function ImageGenerationExample({ state }: { state: ExampleState }) {
  const [agent, setAgent] = useState(agents[0]);
  const [generations, setGenerations] = useState(initialGenerations);
  const [selection, setSelection] = useState<Record<string, string>>({ [agents[0]]: "sample-1" });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<Record<string, string[]>>({});
  const [model, setModel] = useState("Illustration");
  const [style, setStyle] = useState("Soft");
  const [aspect, setAspect] = useState("Landscape");
  const [gallery, setGallery] = useState(false);
  const [hold, setHold] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [request, setRequest] = useState("Synthetic preview only. Downloads save local SVG samples; no image provider or upload is used.");
  const sequence = useRef(0);
  const current = generations.find(item => item.id === selection[agent] && item.agent === agent);
  const disabled = state === "disabled" || scenario === "disabled";
  const busy = current?.state === "generating";
  const act = (label: string, change: () => void) => { if (disabled) return; setRequest(`${label}${hold ? "; host retained state" : ""}.`); if (!hold) change(); };
  const download = (item: Generation) => {
    if (item.state !== "complete" || !item.src?.startsWith("data:image/svg+xml,")) return;
    act("Local synthetic sample download; demonstration only, not provider output", () => {
      const anchor = document.createElement("a");
      anchor.href = item.src!;
      anchor.download = `harso-synthetic-${item.id}.svg`;
      document.body.append(anchor); anchor.click(); anchor.remove();
    });
  };
  const update = (values: Partial<Generation>) => { if (current) setGenerations(previous => previous.map(item => item.id === current.id ? { ...item, ...values } : item)); };
  const select = (item: Generation) => act("Image selected", () => { setSelection(previous => ({ ...previous, [agent]: item.id })); setGallery(false); });
  const retry = () => act("Retry requested", () => { update({ state: "generating", remaining: 12, src: undefined }); setScenario("ready"); });
  const galleryContent = <section aria-label="Generated image gallery"><p>Original synthetic samples, not provider output.</p>{generations.some(item => item.agent === agent && item.state === "complete") ? <div className="hk-image-gallery">{generations.filter(item => item.agent === agent && item.state === "complete").map(item => <div className="hk-image-gallery-item" key={item.id}>
    <Button disabled={disabled} aria-label={`Open ${item.prompt}`} onClick={() => select(item)}><Image src={item.src} alt={item.prompt} /></Button><p>{item.prompt}</p>
    <Button disabled={disabled || !item.src} onClick={() => download(item)}>Download</Button>
    <Dropdown label={`Actions for ${item.prompt}`} disabled={disabled}><DropdownTrigger aria-label={`Actions for ${item.prompt}`}>More</DropdownTrigger><DropdownPopover><DropdownItem label="Reuse prompt" onSelect={() => act("Reuse prompt requested", () => { setDrafts(previous => ({ ...previous, [agent]: item.prompt })); setGallery(false); })} /><DropdownItem label="Remove from gallery" onSelect={() => act("Remove image requested", () => { setGenerations(previous => previous.filter(image => image.id !== item.id)); if (selection[agent] === item.id) setSelection(previous => ({ ...previous, [agent]: "" })); })} /></DropdownPopover></Dropdown>
  </div>)}</div> : <p>No generated images yet.</p>}</section>;
  return <div className="hkl-example-stack" style={{ maxWidth: "none" }}>
    <div className="hk-data-toolbar"><Checkbox label="Hold image host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Example state<Select aria-label="Image example state" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "failed", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label>{busy && <Button disabled={disabled} onClick={() => act("Synthetic update advanced", () => { const remaining = Math.max(0, (current.remaining ?? 4) - 4); update(remaining ? { remaining } : { state: "complete", remaining: undefined, src: sampleImage(sequence.current, current.aspect) }); })}>Advance image update</Button>}</div>
    <AiImageGeneration title="Image studio" state={scenario === "empty" ? "idle" : scenario === "failed" || state === "error" ? "failed" : current?.state ?? "idle"} src={current?.src} prompt={scenario === "empty" ? undefined : current?.prompt} remainingSeconds={current?.remaining} error="Synthetic generation unavailable" onRetry={current ? retry : undefined} disabled={disabled}
      navigation={<><h3>Agents</h3>{agents.map(name => <Button key={name} disabled={disabled} aria-pressed={agent === name} onClick={() => act("Agent selected", () => { setAgent(name); setGallery(false); })}>{name}</Button>)}<h3>Image history</h3><div className="hk-image-history">{generations.filter(item => item.agent === agent).map(item => <Button key={item.id} disabled={disabled} aria-current={current?.id === item.id ? "page" : undefined} onClick={() => select(item)}>{item.prompt} · {item.state}</Button>)}</div></>}
      actions={<Button disabled={disabled} onClick={() => act("Gallery requested", () => setGallery(true))}>Gallery</Button>}
      panel={gallery ? { title: "Gallery", content: galleryContent, onClose: () => act("Close gallery requested", () => setGallery(false)) } : null}
      status={<span>{agent} · {current?.state === "generating" ? "Generating · synthetic" : "Local preview"}</span>}
      feedback={current && <><Button disabled={disabled} aria-pressed={feedback[current.id] === "helpful"} onClick={() => act("Helpful feedback requested", () => setFeedback(previous => ({ ...previous, [current.id]: previous[current.id] === "helpful" ? "" : "helpful" })))}>Helpful</Button><Button disabled={disabled} aria-pressed={feedback[current.id] === "unhelpful"} onClick={() => act("Unhelpful feedback requested", () => setFeedback(previous => ({ ...previous, [current.id]: previous[current.id] === "unhelpful" ? "" : "unhelpful" })))}>Not helpful</Button><Snippet code={current.prompt} disabled={disabled || hold}><SnippetCopyButton label="Copy image prompt" /></Snippet><Button disabled={disabled || current.state !== "complete" || !current.src} onClick={() => download(current)}>Download image</Button></>}
      composer={<Composer value={drafts[agent] ?? ""} onValueChange={value => act("Draft edit requested", () => setDrafts(previous => ({ ...previous, [agent]: value })))} onSubmit={prompt => { if (disabled || busy || !prompt.trim()) return; act("Generate requested", () => { const id = `generated-${++sequence.current}`; setGenerations(previous => [...previous, { id, agent, prompt, state: "generating", remaining: 12, model, style, aspect, references: references[agent] ?? [] }]); setSelection(previous => ({ ...previous, [agent]: id })); setDrafts(previous => ({ ...previous, [agent]: "" })); setScenario("ready"); }); }}>
        <PromptInputTextarea aria-label="Describe your image" placeholder="Describe the image you have in mind…" disabled={disabled} />
        <div className="hk-image-controls">{[{ label: "Model", value: model, change: setModel, values: ["Illustration", "Photo"] }, { label: "Style", value: style, change: setStyle, values: ["Soft", "Minimal", "Vivid"] }, { label: "Aspect ratio", value: aspect, change: setAspect, values: ["Landscape", "Portrait", "Square"] }].map(control => <label key={control.label}>{control.label}<Select aria-label={control.label} value={control.value} disabled={disabled || busy} onChange={event => { const value = event.target.value; act(`${control.label} selected`, () => control.change(value)); }}>{control.values.map(value => <option key={value}>{value}</option>)}</Select></label>)}<label>Reference images<input type="file" accept="image/*" multiple disabled={disabled || busy} onChange={event => { const names = Array.from(event.currentTarget.files ?? [], file => file.name); event.currentTarget.value = ""; act("Reference names selected; no files read", () => setReferences(previous => ({ ...previous, [agent]: names }))); }} /></label></div>
        {(references[agent] ?? []).map((name, index) => <Button key={`${name}-${index}`} disabled={disabled || busy} aria-label={`Remove reference ${name}`} onClick={() => act("Reference removed", () => setReferences(previous => ({ ...previous, [agent]: previous[agent].filter((_, position) => position !== index) })))}>{name} ×</Button>)}
        <PromptInputFooter>{busy ? <Button disabled={disabled} onClick={() => act("Stop generation requested", () => update({ state: "stopped", remaining: undefined }))}>Stop generation</Button> : <PromptInputSubmit disabled={disabled || !(drafts[agent] ?? "").trim()}>Generate image</PromptInputSubmit>}</PromptInputFooter>
      </Composer>}
    >{current && scenario !== "empty" && <Conversation key={current.id}><ConversationContent><Message from="user"><MessageContent><MessageResponse>{current.prompt}</MessageResponse></MessageContent></Message><p>{current.model} · {current.style} · {current.aspect}{current.references.length ? ` · ${current.references.length} references` : ""}</p></ConversationContent></Conversation>}</AiImageGeneration>
    <output aria-label="Image request">{request}</output>
  </div>;
}
