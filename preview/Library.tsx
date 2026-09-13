import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon, CheckIcon, MagnifyingGlassIcon, XIcon, CaretDownIcon, DeviceMobileIcon, DeviceTabletIcon, DesktopIcon, ListIcon, SunIcon, MoonIcon, PaletteIcon } from "@phosphor-icons/react";
import { Badge, Button, Disclosure, Field, IconButton, Input, KitProvider, Select, filterReferences, referenceAccounting, referenceComponents, referenceSources, type Appearance, type Palette, type ReferenceComponent, type ReferenceVendor } from "@harso/ui";
import { FoundationExample, foundationExports, foundationNotes, type ExampleState, type FoundationExport } from "./examples";
import { NavigationExample, navigationExports, navigationNotes, type NavigationExport } from "./navigation-examples";
import { ControlsExample, controlExports, controlNotes, type ControlExport } from "./controls-examples";
import { NavigationSurfacesExample, navigationSurfaceExports, navigationSurfaceNotes, type NavigationSurfaceExport } from "./navigation-surfaces-examples";
import { DatesExample, dateExports, dateNotes, type DateExport } from "./dates-examples";
import { ConversationExample, conversationExports, conversationNotes, type ConversationExport } from "./conversation-examples";
import { WorkExample, workExports, workNotes, type WorkExport } from "./work-examples";
import { DataExample, dataExports, dataNotes, type DataExport } from "./data-examples";
import { ActivityExample, activityExports, activityNotes, type ActivityExport } from "./activity-examples";
import { ContextExample, contextExports, contextNotes, type ContextExport } from "./context-examples";

import { DeveloperContentExample, developerContentExports, developerContentNotes, type DeveloperContentExport } from "./developer-content-examples";

import { FileTreeExample, fileTreeExports, fileTreeNotes, type FileTreeExport } from "./file-tree-examples";

import { CommitExample, commitExports, commitNotes, type CommitExport } from "./commit-examples";
import { StackTraceExample, stackTraceExports, stackTraceNotes, type StackTraceExport } from "./stack-trace-examples";
import { TestResultsExample, testResultsExports, testResultsNotes, type TestResultsExport } from "./test-results-examples";
import { TerminalExample, terminalExports, terminalNotes, type TerminalExport } from "./terminal-examples";
import { CodeBlockExample, codeBlockExports, codeBlockNotes, type CodeBlockExport } from "./code-block-examples";
import { ChainOfThoughtExample, chainOfThoughtExports, chainOfThoughtNotes, type ChainOfThoughtExport } from "./chain-of-thought-examples";
import { AttachmentsExample, attachmentsExports, attachmentsNotes, type AttachmentsExport } from "./attachments-examples";
import { InlineCitationExample, inlineCitationExports, inlineCitationNotes, type InlineCitationExport } from "./inline-citation-examples";
import { ConfirmationExample, confirmationExports, confirmationNotes, type ConfirmationExport } from "./confirmation-examples";
import { CatalogueExample, catalogueExports } from "./catalogue-examples";

function implementedExport(reference: ReferenceComponent): string | undefined {
  return [...foundationExports, ...navigationExports, ...controlExports, ...navigationSurfaceExports, ...dateExports, ...conversationExports, ...workExports, ...dataExports, ...activityExports, ...contextExports, ...developerContentExports, ...fileTreeExports, ...commitExports, ...stackTraceExports, ...testResultsExports, ...terminalExports, ...codeBlockExports, ...chainOfThoughtExports, ...attachmentsExports, ...inlineCitationExports, ...confirmationExports, ...catalogueExports].find(name => name === reference.harsoExport);
}

function selectionFromHash() {
  let hash = window.location.hash.slice(1).split("?")[0];
  try { hash = decodeURIComponent(hash); } catch { hash = ""; }
  return referenceComponents.find(reference => reference.id === hash)?.id;
}

function initialSelection() {
  return selectionFromHash() ?? referenceComponents.find(reference => reference.harsoExport === "Button")?.id ?? referenceComponents[0]?.id;
}

type PreviewViewport = "phone" | "tablet" | "desktop";
function viewportFromHash(): PreviewViewport {
  const value = new URLSearchParams(window.location.hash.split("?")[1]).get("vw");
  return value === "phone" || value === "tablet" ? value : "desktop";
}

export function Library() {
  const [appearance, setAppearance] = useState<Appearance>("system");
  const [palette, setPalette] = useState<Palette>("clean");
  const [query, setQuery] = useState("");
  const [vendor, setVendor] = useState<ReferenceVendor | "all">("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(initialSelection);
  const [exampleState, setExampleState] = useState<ExampleState>("default");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(viewportFromHash);
  const navigationToggleRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const closeNavigation = () => { setNavigationOpen(false); navigationToggleRef.current?.focus(); };
  useEffect(() => {
    if (!navigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navigationRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeNavigation(); }
      if (event.key === "Tab") {
        const targets = navigationRef.current?.querySelectorAll<HTMLElement>("button, input, select, a[href]");
        const first = targets?.[0], last = targets?.[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const resize = () => { if (window.innerWidth > 640) setNavigationOpen(false); };
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); window.removeEventListener("resize", resize); };
  }, [navigationOpen]);
  const [foundation, setFoundation] = useState<FoundationExport>("Field");
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => {
      setViewport(viewportFromHash());
      const selection = selectionFromHash();
      if (selection) { setSelectedId(selection); setExampleState("default"); }
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const visible = filterReferences({ query, vendor }).filter(reference => !availableOnly || implementedExport(reference));
  const selected = referenceComponents.find(reference => reference.id === selectedId) ?? referenceComponents[0];
  const implementation = selected && implementedExport(selected);
  const richerControl = controlExports.find(name => name === implementation);
  const initialControl = foundationExports.find(name => name === implementation);
  const navigationControl = navigationExports.find(name => name === implementation);
  const navigationSurface = navigationSurfaceExports.find(name => name === implementation);
  const dateControl = dateExports.find(name => name === implementation);
  const conversationControl = conversationExports.find(name => name === implementation);
  const workControl = workExports.find(name => name === implementation);
  const dataControl = dataExports.find(name => name === implementation);
  const activityControl = activityExports.find(name => name === implementation);
  const contextControl = contextExports.find(name => name === implementation);
  const developerContentControl = developerContentExports.find(name => name === implementation);
  const commitControl = commitExports.find(name => name === implementation);
  const stackTraceControl = stackTraceExports.find(name => name === implementation);
  const testResultsControl = testResultsExports.find(name => name === implementation);
  const terminalControl = terminalExports.find(name => name === implementation);
  const codeBlockControl = codeBlockExports.find(name => name === implementation);
  const chainOfThoughtControl = chainOfThoughtExports.find(name => name === implementation);
  const attachmentsControl = attachmentsExports.find(name => name === implementation);
  const inlineCitationControl = inlineCitationExports.find(name => name === implementation);
  const confirmationControl = confirmationExports.find(name => name === implementation);
  const fileTreeControl = fileTreeExports.find(name => name === implementation);
  const catalogueControl = implementation && catalogueExports.includes(implementation as typeof catalogueExports[number]) ? implementation : undefined;
  const notes = richerControl ? controlNotes[richerControl] : initialControl ? foundationNotes[initialControl] : navigationControl ? navigationNotes[navigationControl] : navigationSurface ? navigationSurfaceNotes[navigationSurface] : dateControl ? dateNotes[dateControl] : conversationControl ? conversationNotes[conversationControl] : workControl ? workNotes[workControl] : dataControl ? dataNotes[dataControl] : activityControl ? activityNotes[activityControl] : contextControl ? contextNotes[contextControl] : developerContentControl ? developerContentNotes[developerContentControl] : fileTreeControl ? fileTreeNotes[fileTreeControl] : commitControl ? commitNotes[commitControl] : stackTraceControl ? stackTraceNotes[stackTraceControl] : testResultsControl ? testResultsNotes[testResultsControl] : terminalControl ? terminalNotes[terminalControl] : codeBlockControl ? codeBlockNotes[codeBlockControl] : chainOfThoughtControl ? chainOfThoughtNotes[chainOfThoughtControl] : attachmentsControl ? attachmentsNotes[attachmentsControl] : inlineCitationControl ? inlineCitationNotes[inlineCitationControl] : confirmationControl ? confirmationNotes[confirmationControl] : undefined;
  const supportsDisabled = implementation && ["Notification", "NotificationCenter", "Composer", "ComposerAttachments", "ComposerPanel", "AreaChartCard", "LineChartCard", "ComboChartCard", "TaskList", "WebSearch", "SettingsModal", "ModelSelector", "MicSelector", "VoiceSelector", "Button", "IconButton", "Input", "Field", "Textarea", "Checkbox", "Switch", "RadioGroup", "Select", "Slider", "EmptyState", "ButtonGroup", "SegmentedControl", "CloseButton", "Pagination", "Tabs", "ThemeToggle", "Tooltip", "InputOtp", "FileUpload", "Dropdown", "DatePicker", "Calendar", "Conversation", "Message", "Suggestion", "Table", "DataTable", ...workExports, ...activityExports, "Snippet", "EnvironmentVariables", ...fileTreeExports, ...commitExports, ...stackTraceExports, ...testResultsExports].includes(implementation);
  const supportsError = implementation && ["AreaChartCard", "LineChartCard", "ComboChartCard", "TaskList", "WebSearch", "SettingsModal", "ModelSelector", "MicSelector", "VoiceSelector", "Input", "Field", "Textarea", "InputOtp", "DatePicker", "Task", "Table", "DataTable", "Tool"].includes(implementation);
  const supportsLongContent = implementation && ["Notification", "NotificationCenter", "Composer", "ComposerAttachments", "ComposerPanel", "AreaChartCard", "LineChartCard", "ComboChartCard", "TaskList", "WebSearch", "SettingsModal", "ModelSelector", "MicSelector", "VoiceSelector", "Input", "Field", "Breadcrumb", "Announcement", "Tabs", "Dropdown", "Sidebar", "Carousel", "Calendar", "Suggestion", ...workExports, ...dataExports, ...activityExports, ...developerContentExports, ...fileTreeExports, ...commitExports, ...stackTraceExports, ...testResultsExports, ...terminalExports, ...codeBlockExports, ...chainOfThoughtExports, ...attachmentsExports].includes(implementation);
  const availableCount = referenceComponents.filter(reference => implementedExport(reference)).length;
  const select = (reference: ReferenceComponent) => {
    window.location.hash = `${reference.id}${viewport === "desktop" ? "" : `?vw=${viewport}`}`;
    setSelectedId(reference.id);
    setExampleState("default");
    setNavigationOpen(false);
    if (navigationOpen) requestAnimationFrame(() => mainRef.current?.focus());
  };
  const changeViewport = (value: PreviewViewport) => {
    setViewport(value);
    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    if (value === "desktop") params.delete("vw"); else params.set("vw", value);
    window.history.replaceState(null, "", `#${selectedId}${params.size ? `?${params}` : ""}`);
  };
  return <KitProvider appearance={appearance} palette={palette} className="hkl-root">
    <a className="hkl-skip" href="#component-preview">Skip to component</a>
    <header className="hkl-header">
      <nav className="hkl-mobile-navigation" aria-label="Component chooser"><IconButton ref={navigationToggleRef} label={navigationOpen ? "Hide components" : "Browse components"} onClick={() => setNavigationOpen(previous => !previous)} aria-expanded={navigationOpen} aria-controls="component-navigation"><ListIcon size={18} aria-hidden="true" /></IconButton><span className="hk-sr-only">{selected?.name}</span></nav>
      <div className="hkl-wordmark">harso <span>/</span> <span>elements</span></div>
      <div className="hkl-theme-controls">
        <div className="hkl-theme-select"><span className="hkl-select-icon">{appearance === "dark" ? <MoonIcon size={16} /> : <SunIcon size={16} />}</span>
        <label className="hk-sr-only" htmlFor="library-appearance">Appearance</label>
        <Select id="library-appearance" value={appearance} onChange={event => setAppearance(event.target.value as Appearance)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></Select><IconButton className="hkl-theme-cycle" label={`Switch theme (${appearance})`} onClick={() => setAppearance(appearance === "system" ? "light" : appearance === "light" ? "dark" : "system")}>{appearance === "dark" ? <MoonIcon size={18} /> : <SunIcon size={18} />}</IconButton></div>
        <div className="hkl-theme-select"><span className="hkl-select-icon"><PaletteIcon size={16} /></span>
        <label className="hk-sr-only" htmlFor="library-palette">Palette</label>
        <Select id="library-palette" value={palette} onChange={event => setPalette(event.target.value as Palette)}><option value="clean">Clean</option><option value="cozy">Cozy</option></Select><IconButton className="hkl-theme-cycle" label={`Switch colour scheme (${palette})`} onClick={() => setPalette(palette === "clean" ? "cozy" : "clean")}><PaletteIcon size={18} /></IconButton></div>
      </div>
    </header>
    {navigationOpen && <button className="hkl-navigation-backdrop" aria-label="Close component chooser" onClick={closeNavigation} />}
    <div className="hkl-layout">
      <aside ref={navigationRef} className="hkl-navigation" id="component-navigation" data-open={navigationOpen}>
        <div className="hkl-search"><MagnifyingGlassIcon aria-hidden="true" size={18} /><Input aria-label="Find a component" placeholder="Find a component…" value={query} onChange={event => setQuery(event.target.value)} />{query && <IconButton label="Clear search" onClick={() => setQuery("")}><XIcon size={16} /></IconButton>}</div>
        <div className="hkl-filters"><label className="hk-sr-only" htmlFor="reference-source">Reference source</label><span className="hkl-filter-select"><CaretDownIcon size={16} aria-hidden="true" /><Select id="reference-source" value={vendor} onChange={event => setVendor(event.target.value as ReferenceVendor | "all")}><option value="all">All references</option><option value="boardui">BoardUI</option><option value="vercel">Vercel AI Elements</option></Select></span><Button size="small" aria-pressed={availableOnly} onClick={() => setAvailableOnly(previous => !previous)}>Built only</Button></div>
        <p className="hkl-result-count" role="status">{visible.length} references · {availableCount} mapped family previews</p>
        <nav aria-label="Component references"><ul>{visible.map(reference => <li key={reference.id}><button type="button" aria-current={selected?.id === reference.id ? "page" : undefined} onClick={() => select(reference)}><span>{reference.name}</span><span className="hkl-reference-kind">{reference.vendor === "boardui" ? "B" : "V"}</span>{implementedExport(reference) && <CheckIcon size={12} aria-label="Initial implementation" />}</button></li>)}</ul>{!visible.length && <p className="hkl-no-results">No matching references. Try a component or subcomponent name.</p>}</nav>
      </aside>
      <main ref={mainRef} className="hkl-main" id="component-preview" tabIndex={-1}>
        <div className="hkl-eyebrow">The boundaryless collection</div>
        <div className="hkl-title-row"><h1>{selected?.name}</h1><Badge tone={implementation ? "positive" : "neutral"}>{implementation ? "Initial implementation" : "Planned"}</Badge></div>
        <p className="hkl-description">{selected?.description}</p>
        <div className="hkl-reference-meta"><span>{selected?.vendor === "boardui" ? "BoardUI" : "Vercel AI Elements"} → Harso {selected?.harsoExport}</span><a href={selected?.url} target="_blank" rel="noreferrer">Public reference <ArrowUpRightIcon size={14} aria-hidden="true" /></a></div>
        {implementation ? <>
          <div className="hkl-preview-heading"><h2>Feel it in use.</h2><label className="hk-sr-only" htmlFor="example-state">Example state</label><Select id="example-state" value={exampleState} onChange={event => setExampleState(event.target.value as ExampleState)}><option value="default">Default</option>{supportsDisabled && <option value="disabled">Disabled</option>}{supportsError && <option value="error">Error</option>}{supportsLongContent && <option value="long-content">Long content</option>}</Select></div>
          <div className="hkl-preview-frame"><div className="hkl-preview-toolbar"><span className="hkl-preview-chip">Preview · {exampleState.replaceAll("-", " ")}</span><div className="hkl-viewport-controls" role="group" aria-label="Preview viewport"><IconButton label="Phone viewport" aria-pressed={viewport === "phone"} onClick={() => changeViewport("phone")}><DeviceMobileIcon size={18} /></IconButton><IconButton label="Tablet viewport" aria-pressed={viewport === "tablet"} onClick={() => changeViewport("tablet")}><DeviceTabletIcon size={18} /></IconButton><IconButton label="Desktop viewport" aria-pressed={viewport === "desktop"} onClick={() => changeViewport("desktop")}><DesktopIcon size={18} /></IconButton></div></div><div className="hkl-preview-stage" data-viewport={viewport} style={{ maxWidth: viewport === "phone" ? 390 : viewport === "tablet" ? 1024 : "100%", containerType: "inline-size" }}><div className="hkl-live-example" data-testid="live-example">{initialControl ? <FoundationExample key={`${selected?.id}:${exampleState}`} component={initialControl} state={exampleState} /> : navigationControl ? <NavigationExample key={`${selected?.id}:${exampleState}`} component={navigationControl} state={exampleState} palette={palette} /> : richerControl ? <div data-testid="controls-example"><ControlsExample key={`${selected?.id}:${exampleState}`} component={richerControl} state={exampleState} /></div> : navigationSurface ? <div data-testid="navigation-surface-example"><NavigationSurfacesExample key={`${selected?.id}:${exampleState}`} component={navigationSurface} state={exampleState} /></div> : dateControl ? <DatesExample key={`${selected?.id}:${exampleState}`} component={dateControl} state={exampleState} /> : conversationControl ? <ConversationExample key={`${selected?.id}:${exampleState}`} component={conversationControl} state={exampleState} /> : workControl ? <WorkExample key={`${selected?.id}:${exampleState}`} component={workControl} state={exampleState} /> : dataControl ? <DataExample key={`${selected?.id}:${exampleState}`} component={dataControl} state={exampleState} /> : activityControl ? <ActivityExample key={`${selected?.id}:${exampleState}`} component={activityControl} state={exampleState} /> : contextControl ? <ContextExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : developerContentControl ? <DeveloperContentExample key={`${selected?.id}:${exampleState}`} component={developerContentControl} state={exampleState} /> : fileTreeControl ? <FileTreeExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : commitControl ? <CommitExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : stackTraceControl ? <StackTraceExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : testResultsControl ? <TestResultsExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : terminalControl ? <TerminalExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : codeBlockControl ? <CodeBlockExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : chainOfThoughtControl ? <ChainOfThoughtExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : attachmentsControl ? <AttachmentsExample key={`${selected?.id}:${exampleState}`} component={attachmentsControl} state={exampleState} /> : inlineCitationControl ? <InlineCitationExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : confirmationControl ? <ConfirmationExample key={`${selected?.id}:${exampleState}`} state={exampleState} /> : catalogueControl ? <CatalogueExample key={`${selected?.id}:${exampleState}`} component={catalogueControl} state={exampleState} /> : null}</div>
          </div></div>
          {richerControl && initialControl && <section className="hkl-controls-composition"><h2>Compositions and states.</h2><div data-testid="controls-example"><ControlsExample key={`${selected?.id}:${exampleState}`} component={richerControl} state={exampleState} /></div></section>}
          <section className="hkl-specification" hidden={!notes?.behavior && !notes?.example}><h2>Behavior, not decoration.</h2>{notes?.behavior && <p>{notes.behavior}</p>}{notes?.example && <pre><code>{notes.example}</code></pre>}<p className="hkl-proof-note">Interactive local example · synthetic state · full reference parity remains under review</p></section>
        </> : <section className="hkl-pending"><span className="hkl-pending-mark" aria-hidden="true">—</span><h2>Mapped. Not built yet.</h2><p>This reference has a place in the library. It will receive an original Harso composition, meaningful interactions and its own proof—not a generic placeholder counted as complete.</p><Button onClick={() => { const button = referenceComponents.find(reference => reference.harsoExport === "Button"); if (button) select(button); }}>Explore the foundations</Button></section>}
        <section className="hkl-anatomy"><h2>Reference anatomy</h2><p>Each documented element stays accounted for. This is a design and behavior map, not a copy of donor source.</p><div className="hkl-parts">{selected?.parts.length ? selected.parts.map(part => <div key={part.name}><code>{part.name}</code><span>→</span><code>{part.harsoExport}</code></div>) : <p>Standalone reference component; no separately documented subcomponent API.</p>}</div>{!!selected?.variants.length && <Disclosure summary={`${selected.variants.length} documented examples and variants`}><ul>{selected.variants.map(variant => <li key={variant}>{variant}</li>)}</ul></Disclosure>}</section>
        {!!selected?.helperApis?.length && <Disclosure key={selected.id} summary="Documented helper APIs and types"><p>Nonvisual reference APIs, not available Harso exports or an SDK adoption commitment.</p><ul className="hkl-provenance">{selected.helperApis.map(name => <li key={name}><code>{name.replaceAll("`", "")}</code></li>)}</ul></Disclosure>}
        <Disclosure summary="Inventory, scope and provenance"><div className="hkl-provenance">{referenceSources.map(source => <p key={source.vendor}><strong>{source.vendor === "boardui" ? "BoardUI" : "Vercel AI Elements"}</strong> · {source.componentCount} reference families · captured {source.retrievedAt.slice(0, 10)}<br /><code>{source.identity}</code></p>)}<p>{referenceAccounting.note}</p><p>Original Harso implementations. No Pro source, demo transport, or new preference store. The existing desktop remains unchanged.</p></div></Disclosure>
        <section className="hkl-foundation-sampler"><h2>A shared foundation.</h2><p>Inspect every native foundation, including Harso components beyond the source catalogue.</p><div className="hkl-foundation-picker"><Field label="Foundation component">{props => <Select {...props} value={foundation} onChange={event => setFoundation(event.target.value as FoundationExport)}>{foundationExports.map(component => <option key={component}>{component}</option>)}</Select>}</Field></div><div className="hkl-foundation-example" data-testid="foundation-example"><FoundationExample key={foundation} component={foundation} state="default" /></div></section>
        <footer className="hkl-footer">Harso · Original component library · Work in progress, not a released desktop</footer>
      </main>
    </div>
  </KitProvider>;
}
