# Harso UI — Boundaryless

Original React component library for Harso. 126 component families in the
minimal "Boundaryless" direction — System/Light/Dark appearance with Clean/Cozy
palettes, native browser primitives first (`<dialog>`, popovers, CSS anchors,
native selects), no vendor code.

The public **BoardUI** (77 families) and **Vercel AI Elements** (49 families)
inventories were used as a one-to-one coverage checklist so nothing was missed.
They are references, not dependencies: no Pro purchase, no API or pixel parity.

## Use

```ts
import { Button, Conversation, Composer, KitProvider } from "@harso/ui";
import "@harso/ui/styles.css";
```

Peer deps: React 19. Everything else ships as a regular dependency.

## Develop

```sh
npm install
npm run dev          # gallery at http://127.0.0.1:4194 (every family, every state)
npm run typecheck    # library + preview/tests
npm test             # vitest (jsdom), 1,000+ unit tests
npm run test:e2e     # Playwright against the gallery (Chrome)
npm run build        # gallery build (library is consumed as source)
```

## Layout

| Path | What |
|---|---|
| `src/` | The library. One file per family group, CSS beside it, `index.ts` is the public surface. `primitives.css` imports every stylesheet. |
| `src/catalog.json` | The 126-family inventory with its reference mapping. |
| `src/coverage.json` | 2,841 requirement rows × evidence. Machine-readable; see `docs/`. |
| `preview/` | The gallery app: one example file per family, host-controlled state so every variant can be reached without a backend. |
| `tests/` | Playwright specs (`boundaryless-*.spec.ts`) that drive the gallery. |
| `docs/` | `COMPONENTS.md` (per-family contracts and intentional reference differences), `COVERAGE.md`, `REMAINING.md`, `IMPLEMENTATION.md`, `VERIFICATION.md`. |

## Status

Candidate. All 126 families implemented; unit, typecheck, build and browser
suites green at extraction. Of 2,841 requirement rows, 2,673 are evidenced,
35 are not applicable, and 133 are open. Those 133 are one row per family for
real assistive-technology use plus a handful needing real hardware (microphone,
OS OTP autofill, audible speech output). They are a device-validation gate, not
missing components. See `docs/REMAINING.md`.

## Origin

Extracted from `StraitsLab/weave-cloud` (`packages/ui/src/boundaryless`,
`apps/ui-preview/src/boundaryless`, `apps/ui-preview/tests/boundaryless-*`) at
base `f973ec12`, September 2026. The evidence history in `coverage.json` still
cites original monorepo paths and `/tmp/harso-*` evidence directories from the
construction sessions; those references are historical.
