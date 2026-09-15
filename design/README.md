# Harso Boundaryless — Sketch source

`Harso Boundaryless.sketch` is the design source for the kit. The direction of travel is **Sketch → code**:
a change is made here first, then landed in `src/` and verified against a Sketch screenshot.

## What is in the file

| Page | Content |
|---|---|
| Foundations | Token sheet: 22 colour roles × 4 appearances (Light/Dark × Clean/Cozy) as document swatches, plus the 8-step type ramp as shared text styles. |
| Components | Base specimens for Light/Clean and Dark/Clean, each promoted to a Symbol: Button (5 variants + 2 disabled), Input (5 states), Badge (4 tones), Chip (2), Checkbox/Radio/Switch (off/on), Tabs, Segmented, Avatar, Card. 50 symbols. |

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
