# HarsoOutputDetail

Display-only, content-first presentation for a host-owned output. Exported with
`HarsoOutputDetailProps`, `HarsoOutputAction`, and `HarsoOutputPreviewState` from
`@harso/ui`. Mount inside `KitProvider` and load `@harso/ui/styles.css`.

```tsx
<HarsoOutputDetail
  contentKey={selectedArtifact.id}
  title={selectedArtifact.title}
  kind="image"
  content={<img src={hostPreview} alt={hostDescription} />}
  details={<p>{hostMetadata}</p>}
  previewState="ready"
  actions={{
    download: { enabled: canDownload, pending: downloading, error: downloadError,
      unavailableReason: downloadUnavailableReason, onInvoke: download },
    expand: { enabled: canExpand, pending: false, onInvoke: expandInApp },
    openExternally: { enabled: canOpen, pending: opening, onInvoke: openInOS },
  }}
  onClose={closePane}
/>
```

## Frozen public surface

- `contentKey: string`: opaque host identity, not a URL or authority token.
- `title: string`; `kind: 'image' | 'document' | 'file'`.
- `content: ReactNode`; optional `details: ReactNode`: **trusted application
  composition only**, never agent-authored component data or raw HTML. The host
  owns semantic headings, image alt, safe rendering and labelled keyboard-scrollable
  table regions. The kit preserves these nodes, it does not parse or sanitize them.
- `previewState: 'loading' | 'ready' | 'unsupported' | 'error' | 'unavailable'`.
  Optional `previewMessage: string` overrides the safe default explanation.
  The stable polite status node changes only with these props; ready invents no
  success receipt. The host chooses which content remains visible.
- `actions: { download?, expand?, openExternally? }`. Each supplied action is
  `{ enabled: boolean; pending: boolean; unavailableReason?: string;
  error?: string; onInvoke: () => void }`.
- `onClose: () => void`; optional `className: string`.

## Capability and asynchronous ownership

Omit an unsupported action entirely. Supplied disabled or pending actions are
native disabled buttons and cannot invoke. Reasons and safe error messages are
visible and associated with the individual control. Pending is independent per
action. A download error changes only Download to **Retry download**, not Expand
or Open externally, and does not remove ready content.

The host must rerender pending synchronously and maintain its own asynchronous
duplicate-operation fence; the kit neither awaits nor catches promises. Reset or
error outcomes must be projected back explicitly. Expand invokes only the host's
in-app callback, never Download or Open externally. No fetch, URL interpretation,
Blob, native bridge, cache, parser, transport, preview decode or success toast is
implemented here. Preview availability does not imply download capability, and
Work status does not control actions.

## Details and focus

Details is optional, initially closed, and resets on `contentKey` changes. The
trigger has `aria-expanded` and `aria-controls`; the disclosure is a labelled
nonmodal region with no backdrop or focus trap. Opening it keeps content mounted.
Tab/Shift-Tab follow document order. Escape inside the detail component while the
disclosure is open closes it, stops propagation and returns focus to Details;
otherwise Escape bubbles to the host. The host owns pane/modal entry and final
close focus, stale identity guards and tenant revocation. Do not key/remount the
whole component for a width change if retaining host content scroll is required.
On a host-driven `contentKey` switch, the kit closes Details but does not choose a
new output's entry-focus destination. If focus was inside the now-hidden metadata,
the browser may return it to BODY. The host must explicitly move focus to its
chosen visible entry target when switching identity; it must not rely on Escape's
local trigger restoration for that separate lifecycle event.

## Layout and runtime configuration

Width is container-owned: 100%, min-width zero. At the bound 520px pane the header
has 20px horizontal insets, 12px top inset, centred 15px title and actual 44px
controls. Image content begins at y88; document at y80 with 28px inner padding
and radius12. Actions follow content by24px, not a fixed footer. Widths112/96/148
wrap when constrained. Images use natural aspect and contain, never fixed crop.
Real documents grow: **no production page height**. Every new control has a real
44px minimum box and no inherited pseudo-element hit expansion. Details is332px
bounded to available width, scrollable when tall. While open, it is anchored to
the Details trigger (not the bottom of a wrapping title), chooses above/below
based on available space, and caps its height to the visible viewport and
vertically clipping ancestors. ResizeObserver, captured scroll and visual viewport
events keep that bound current without remounting content or changing tab order.

All capabilities/content/status are live props; appearance, spacing, radii and
type use the existing `--hk-*` runtime CSS tokens. There is no additional config
file, compile-time feature flag, transport setting or host policy. Fixed action
labels and frozen target dimensions are the accepted kit interface/design, not
operator policy. Reduced motion retains textual pending status; forced colors
add visible control/disclosure boundaries.

## Work-result selector seam

`HarsoWorkResult` adds `artifactContent?: ReactNode`. Non-null/undefined content
replaces the entire legacy artifact list **inside the existing open fragment**.
It collapses with steps, rich/plain summary and footer. `null`/`undefined` retain
legacy artifact rows and their expansion. An empty fragment intentionally
suppresses the legacy list. Do not put a selector in the `action` footer or render
it beside the card; do not pass agent component data.

```tsx
<HarsoWorkResult title="Two outputs" status="succeeded"
  summaryContent={existingRichSummary}
  artifactContent={<OutputSelector onSelect={hostSelect} />}
/>
```

## Dedicated proof fixture

`/preview/c1-image-document.html` mounts only this kit seam. It byte-copies the
bound local320×200 original artwork; **all content and callback counters are
simulated**, not installed/transport/download proof. Query parameters: `kind=document`,
`mode=dark`, `preview=loading|unsupported|error|unavailable`,
`action=omitted|disabled|pending|error`, `long=1`, `tall=1`.
The document uses semantic HTML (heading, strong, table with exactly two body
rows), no new Markdown engine. Fixture controls below the pane exercise host
rerenders, selection, collapse, pending and failure. The preview entry is served
by existing Vite; it is deliberately not added to the gallery/build inputs.

```sh
npm run check
npm test -- src/chat/work-result.test.tsx src/chat/output-detail.test.tsx
# Inspect port4296 first; never reuse another worktree's server.
HARSO_UI_PORT=4296 npm run test:e2e -- tests/harso-output-detail.spec.ts --workers=1
```

Browser proof covers pane geometry, image decode, semantic document, positive and
negative callbacks, keyboard/focus/scroll retention, 390px wrapping, long title,
200% CSS layout zoom, forced colors and reduced motion. CSS layout zoom is not a
claim of native browser-menu zoom or a screen-reader user's experience. Independent
counterexample, cross-family source acceptance, required CI, host integration,
download-byte/tenant/Library/reopen and installed acceptance remain separate gates.
