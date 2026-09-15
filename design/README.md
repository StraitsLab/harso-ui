# Harso Boundaryless — Sketch source

`Harso Boundaryless.sketch` is the design source for the kit. The direction of travel is **Sketch → code**:
a change is made here first, then landed in `src/` and verified against a Sketch screenshot.

## What is in the file (v0.3 — complete kit, 2026-09-15)

**2,045 symbols · 173 families · 4 appearances (Light/Dark × Clean/Cozy) · 88 swatches · 28 text styles.**

| Page | Sheets | Content |
|---|---|---|
| Foundations | 1 | Token sheet: 22 colour roles × 4 appearances as document swatches; type ramp as shared text styles. |
| Apple reference | 1 | 35 iOS 27 / macOS 27 library instances used for the style audit (see below). |
| Controls | 76 | Button (5 variants × 5 states × sizes × icon), IconButton, ButtonGroup, LinkButton, SocialButton, CloseButton, Input, InputOtp, Select (pop-up), Dropdown (pull-down), Checkbox, Radio, Switch, Slider, DatePicker, FileUpload, ThemeToggle, **Stepper**, **ComboBox**. |
| Display | 68 | Avatar, Badge, Chip, Announcement, Notification, Tooltip, Divider, Carousel, Pagination, Breadcrumb, Tabs, SegmentedControl, Table, Typography, **Progress**, **Disclosure**, **EmptyState**. |
| Navigation | 56 | Menu, Popover, Sidebar, SettingsModal, NotificationCenter, **Dialog**, **Sheet**, **ActionSheet**, **CommandPalette**, **Toolbar**, **TabBar**, **SearchField**, **GroupBox**, **Kbd**. |
| Blocks | 64 | AgentLimitsCard, AgentProgress, AgentThinking, AuthCard, Calendar, DataTable (+ phone), StatCards, TaskList, WebSearch, Questionnaire; templates Finance/Home/HR/Marketing/Medical at 1280×N + HrManagementPhone. |
| Charts | 76 | 19 chart cards with vector plots, period selectors, value labels and bound legends. |
| AI Code | 60 | Agent, Artifact, CodeBlock, Commit, EnvironmentVariables, FileTree, JsxPreview, PackageInfo, Sandbox, SchemaDisplay, Snippet, StackTrace, Terminal, TestResults, WebPreview. |
| AI Chat | 96 | UserMessage, AssistantMessage, Reasoning, Tool, Confirmation, Task, Plan, ChainOfThought, Checkpoint, Context, InlineCitation, Sources, ModelSelector, Queue, Question, Shimmer, Attachments, Composer, ThreadList, MessageError, StoppedRun; ChatShell frames at 1440/1024/390. |
| AI Voice & Workflow | 60 | AudioPlayer, MicSelector, Persona, SpeechInput, Transcription, VoiceSelector; Canvas, Node, Edge, Connection, Controls, Panel, Toolbar; Image, OpenInChat. |

Bold = new families added in this pass (not yet in code). Each family × appearance is one sheet named
`<Family> — <Appearance>`, laid out in four columns (x = 0 / 1600 / 3200 / 4800).

### Apple iOS 27 / macOS 27 alignment

Apple's 27 design kits (Sketch, 8 Jun 2026; 1,137 iOS + 3,633 macOS symbols) were installed as libraries and
audited on the `Apple reference` page. Boundaryless stays primary. Adopted: indented separators; radius 16–20 on
floating surfaces vs 8 on controls; tonal-pill selection inset 8px; pop-up (⇅) vs pull-down (⌄) distinction;
right-aligned shortcut glyph groups; embedded steppers; determinate circular progress; two-column form rows;
one ambient shadow on floating layers; icons at cap height. Rejected: glass/blur materials, Apple colours,
SF glyph style, pill-everything. Elements Apple has that we lacked and that matter for Weave were added as the
bold families above; CommandPalette and EmptyState come from Linear/Raycast instead.

### Verification

Three rounds of independent vision review against the rendered web kit (`review/round1-*.md`, `round2-*.md`,
`round3.md`): 123/276 → 244/278 → all 34 re-touched sheets ≥8 after the final inline fixes. The build and review
briefs, the prelude and every generator that produced the file are in `sketch-scripts/`.

Symbol names map to kit classes: `Button/Light/Clean/primary/default` ↔ `.hk-button.hk-button--primary`.
Swatch names map to CSS custom properties: `Dark/Clean/accent-soft` ↔ `--hk-accent-soft` inside `.harso-kit[data-mode="dark"]`.

## Round-trip contract

Swatches are the token authority. `scripts/export-tokens.js` reads them back; the check in this directory's history
proved 84/84 tokens identical to `src/theme.css` at seed time (`v0.2.0`). When a swatch changes in Sketch, regenerate
the four `theme.css` blocks from that export rather than editing hex values by hand.

## Driving Sketch

Sketch's MCP server is at `http://localhost:31126/mcp` (Settings → General → *Allow AI tools*). `scripts/sk.py` is a
stdlib-only client: `python3 scripts/sk.py --list`, `python3 scripts/sk.py run_code '{"code_file": "…js"}'`,
`python3 scripts/sk.py get_screenshot '{"targetDocumentID": "…", "layerID": "…"}'`.

Things the API does not tell you:

- `run_code` takes `script`, not `code`; `get_screenshot` requires `targetDocumentID`, which changes when a document is saved-as.
- Column/row stacks render index 0 **last** (bottom / right). Reverse child indices after building in reading order.
- `fontWeight` is Sketch's 1–12 scale (5 = regular, 6 = medium); 400/500 are silently ignored.
- Structural Frames paint a default fill; clear `style.fills` on any Frame used purely for layout.
- Corner radius is `layer.style.corners.radii = [tl, tr, br, bl]`; `points[].cornerRadius` does not exist on Frames.
- `sketch.SymbolMaster.fromFrame(frame)` promotes in place and the sheet keeps rendering identically.

The seed scripts (`gen-tokens.py`, `gen-foundations.py`, `gen-components.py`) rebuild the file from `src/theme.css`
and the CSS control contract; they are the record of how the first version was derived, not a routine tool.
