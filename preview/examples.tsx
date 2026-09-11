import { useId, useState } from "react";
import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react";
import { Avatar, Badge, Button, Checkbox, Disclosure, EmptyState, Field, IconButton, Input, Link, Progress, RadioGroup, Select, Separator, Skeleton, Slider, Switch, Textarea } from "@harso/ui";

export const foundationExports = ["Button", "IconButton", "Link", "Input", "Textarea", "Checkbox", "Switch", "RadioGroup", "Select", "Slider", "Progress", "Badge", "Avatar", "Skeleton", "Separator", "Field", "EmptyState", "Disclosure"] as const;
export type FoundationExport = typeof foundationExports[number];
export type ExampleState = "default" | "disabled" | "error" | "long-content";

export const foundationNotes: Record<FoundationExport, { behavior: string; example: string }> = {
  Button: { behavior: "Native button; non-submit by default. Primary, quiet, outline and danger appearances. Pending prevents repeat activation without changing the label.", example: '<Button variant="primary" onClick={save} pending={saving}>Save changes</Button>' },
  IconButton: { behavior: "Every icon-only action requires an accessible label and retains a visible keyboard focus ring.", example: '<IconButton label="Attach a file" onClick={attach}><PlusIcon /></IconButton>' },
  Link: { behavior: "Native link semantics and browser navigation. Links are recognisable without relying on color alone.", example: '<Link href="/library">View library</Link>' },
  Input: { behavior: "Native input supports standard types, forms, refs, autocomplete and controlled or uncontrolled values. Pair it with Field for labels and errors.", example: '<Field label="Project name">{props => <Input {...props} value={name} onChange={update} />}</Field>' },
  Textarea: { behavior: "Multiline native editing, selection and undo. Resizes vertically; preserves host-owned form values.", example: '<Textarea aria-label="Instructions" value={instructions} onChange={update} />' },
  Checkbox: { behavior: "Native checkbox with a clickable text label, standard form semantics and optional description.", example: '<Checkbox label="Keep this draft" checked={keep} onChange={update} />' },
  Switch: { behavior: "A labelled native checkbox with switch semantics. State changes only through the supplied handler; no hidden preference persistence.", example: '<Switch label="Voice input" checked={enabled} onChange={update} />' },
  RadioGroup: { behavior: "Native grouped radio inputs provide arrow-key selection. Each group has a unique name unless explicitly supplied; individual options can be disabled.", example: '<RadioGroup label="Audience" options={audiences} value={audience} onValueChange={setAudience} />' },
  Select: { behavior: "Native selection keeps platform keyboard, assistive-technology and touch-picker support.", example: '<Select aria-label="Audience" value={audience} onChange={update}><option value="team">Our team</option></Select>' },
  Slider: { behavior: "Native range input exposes bounds, step and arrow-key adjustment. The host chooses the unit and value.", example: '<Slider aria-label="Volume" min={0} max={100} value={volume} onChange={update} />' },
  Progress: { behavior: "Determinate only when the host supplies a finite value. Omit value for indeterminate activity. Never guesses work completion from a timer.", example: '<Progress label="Files processed" value={processed} max={total} />' },
  Badge: { behavior: "Small textual status indicators. Meaning remains in the label rather than color alone; no automatic live announcement.", example: '<Badge tone="attention">Needs your input</Badge>' },
  Avatar: { behavior: "Initials fallback, accessible name and optional host-supplied image. A failed image falls back to initials.", example: '<Avatar name="Alex Morgan" />' },
  Skeleton: { behavior: "A bounded loading placeholder, with a screen-reader status label. Animation stops under reduced motion.", example: '<Skeleton label="Loading conversations" />' },
  Separator: { behavior: "A semantic divider when whitespace alone is insufficient. Supports horizontal and vertical orientation.", example: '<Separator orientation="horizontal" />' },
  Field: { behavior: "Unique label, hint and error associations through a render function. Does not clone or override the consumer's control state.", example: '<Field label="Name" error={error} required>{props => <Input {...props} />}</Field>' },
  EmptyState: { behavior: "Confirmed-empty content with a meaningful action supplied by the host. Unavailable or loading data must not be passed as confirmed empty.", example: '<EmptyState title="No projects yet" description="Give your next idea a home." action={<Button onClick={create}>New project</Button>} />' },
  Disclosure: { behavior: "Native details/summary disclosure provides keyboard toggling and an explicit open state without a separate state engine.", example: '<Disclosure summary="View evidence"><Evidence /></Disclosure>' },
};

export function FoundationExample({ component, state }: { component: FoundationExport; state: ExampleState }) {
  const identity = useId();
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(true);
  const [audience, setAudience] = useState("team");
  const [volume, setVolume] = useState(40);
  const [clicks, setClicks] = useState(0);
  const disabled = state === "disabled";
  const error = state === "error" ? "Add a name before continuing." : undefined;
  const title = state === "long-content" ? "A thoughtful name for the next chapter of this project" : "Project name";
  const onClick = () => setClicks(previous => previous + 1);
  const options = [{ value: "team", label: "Our team" }, { value: "everyone", label: "Everyone" }, { value: "partners", label: "Partners", disabled: true }];
  switch (component) {
    case "Button": return <div className="hkl-example-stack"><div className="hkl-example-row"><Button variant="primary" disabled={disabled} onClick={onClick}>Continue <ArrowRightIcon size={16} /></Button><Button disabled={disabled} onClick={onClick}>Not now</Button><Button variant="outline" disabled={disabled} onClick={onClick}>Explore</Button><Button variant="danger" disabled={disabled} onClick={onClick}>Remove</Button></div><div className="hkl-example-row"><Button pending>Saving changes</Button><Button disabled>Unavailable</Button></div><output className="hkl-example-output" aria-live="polite">{clicks ? `${clicks} example actions received` : "Try an action. This example does not save anything."}</output></div>;
    case "IconButton": return <div className="hkl-example-stack"><IconButton label="Attach a file" disabled={disabled} onClick={onClick}><PlusIcon /></IconButton><output aria-live="polite">{clicks ? "Attachment action received" : "A named action without a persistent text label."}</output></div>;
    case "Link": return <div className="hkl-example-row"><Link href="#boardui:button">Explore buttons</Link><Button variant="link" disabled={disabled} onClick={onClick}>Local action · {clicks}</Button></div>;
    case "Input": case "Field": return <Field label={title} description="A name your team can recognise." error={error} required>{props => <Input {...props} disabled={disabled} value={text} placeholder="A new beginning" onChange={event => setText(event.target.value)} />}</Field>;
    case "Textarea": return <Field label="What should we know?" error={error}>{props => <Textarea {...props} disabled={disabled} placeholder="Add the context that matters…" value={text} onChange={event => setText(event.target.value)} />}</Field>;
    case "Checkbox": return <Checkbox label="Keep this draft" description="You can return to it later." disabled={disabled} checked={checked} onChange={event => setChecked(event.target.checked)} />;
    case "Switch": return <Switch label="Voice input" description="Example setting, not a microphone permission request." disabled={disabled} checked={checked} onChange={event => setChecked(event.target.checked)} />;
    case "RadioGroup": return <RadioGroup label="Who are we speaking to?" options={options} value={audience} disabled={disabled} onValueChange={setAudience} />;
    case "Select": return <Field label="Audience">{props => <Select {...props} disabled={disabled} value={audience} onChange={event => setAudience(event.target.value)}>{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</Select>}</Field>;
    case "Slider": return <div className="hkl-example-stack"><label htmlFor={identity}>Volume · {volume}%</label><Slider id={identity} aria-label="Volume" disabled={disabled} min={0} max={100} value={volume} onChange={event => setVolume(Number(event.target.value))} /></div>;
    case "Progress": return <div className="hkl-example-stack"><span>3 of 6 sources reviewed</span><Progress label="Sources reviewed" value={3} max={6} /><span>Waiting for the next update</span><Progress label="Waiting for the next update" /></div>;
    case "Badge": return <div className="hkl-example-row"><Badge>Draft</Badge><Badge tone="active">Working</Badge><Badge tone="positive">Complete</Badge><Badge tone="attention">Needs your input</Badge><Badge tone="negative">Couldn’t finish</Badge></div>;
    case "Avatar": return <div className="hkl-example-row"><Avatar name="Alex Morgan" size={48} /><Avatar name="Sam" /><Avatar name="Jordan Lee" size={28} /></div>;
    case "Skeleton": return <div className="hkl-example-stack"><Skeleton label="Loading a title" style={{ width: "55%", height: 24 }} /><Skeleton label="Loading description" /><Skeleton label="Loading more content" style={{ width: "80%" }} /></div>;
    case "Separator": return <div className="hkl-example-stack"><span>Space does most of the work.</span><Separator /><span>A line only when it earns its place.</span></div>;
    case "EmptyState": return <EmptyState title="Room for your next idea." description="Create a project when you’re ready to bring the work together." action={<Button variant="primary" disabled={disabled} onClick={onClick}>{clicks ? "Example project created" : "New project"}</Button>} />;
    case "Disclosure": return <Disclosure summary="View the evidence"><p>Six sources agree on a smaller, more focused launch. These are illustrative notes, not a live research result.</p></Disclosure>;
  }
}
