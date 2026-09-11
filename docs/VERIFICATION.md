# Boundaryless candidate verification

## WEV-1502 — terminal speech callback isolation

The inherited stale callback gap identified in WEV-1501 is repaired at the
existing SpeechInput generation guard. Failure, recognition end and completed
transcription invalidate the run; the existing release handle prevents a saved
recorder stop callback from starting duplicate host transcription while pending.
The same capture-ownership guard rejects late recorder start/data/error events
without discarding legitimate in-flight host transcription. Independent review
found this latter gap in the first correction; that failed report is retained.
No API, backend, provider or device setting changes.

Current-artifact tests first reproduced three stale recognition/recording cases,
then duplicate pending-transcription and late-capture-event cases. All eleven focused tests pass;
serving the exact prior source through a disposable test transform makes all
four new regressions fail. Full library regression passes 1,008 tests in 58 files;
UI typecheck passes. Evidence is under `/tmp/harso-library-1502/`.
These callback-double tests do not close actual AT, microphone/provider,
audible-output or OS-autofill obligations. Counts stay 2,673/133/35.

## WEV-1501 — native speech catalogue consumers

ChatStarter now connects Read aloud to an explicitly selected local English
system voice, with stop, error feedback, host refusal and context cleanup.
SpeechInput now displays actual callback text with Clear and an upfront browser
speech-service disclosure. No transcription provider or backend is added.

Nine focused browser wiring checks pass with explicit speech doubles; cleanup
sabotage fails the same view-transition assertion. These are not audible-output,
microphone, provider or assistive-technology proof. A native Chrome click first
reported voices unavailable, then showed an active reading control on retry;
audibility and completed native stop were not established. See
`/tmp/harso-library-1501/native-observation.md` and evidence logs.

The 133 native obligations remain open. Independent review found an inherited
SpeechInput stale-result-after-terminal-event gap, routed separately rather
than concealed by the new example. Historical WEV-1498 evidence below remains
unchanged; its disabled-output description refers to that frozen candidate.

## Current handoff — September 10, 2026

126 implemented families; immutable 2,841-row inventory. Current accounting:
**2,673 proven, 133 implemented-unverified, 35 justified N/A**. No remaining
known local presentation defect from the bounded review. This is a construction
candidate, not full-library readiness, Land acceptance, or desktop adoption.

The 133 open obligations are 124 combined keyboard/focus/actual-AT rows, three
OS-autofill rows, five native speech-input/associated visual-state rows, and one
combined ChatStarter copy/read-aloud row whose speech output is not connected.
They are not 133 missing components. Exact items remain in REMAINING.md; no
obligation was deleted or relabelled proven to reach this checkpoint.

Final affected presentation regression: **40 passed**, including shared citation
placement after attachment changes. Two test-only Node.remove typing corrections
use native parentNode.removeChild; the three affected mutation cases pass again.
Final UI typecheck and library unit run pass **1,004 tests in 58 files** after
all production repairs.
Corrected preview typecheck and disposable build pass, retaining the existing
chunk-size warning. The earlier **102-case** regression remains source-scoped
supporting history, not a claim of rerunning that whole suite after later CSS
repairs. Snapshot baseline comparisons remain excluded, not approved.

Independent final review passes attachment error contrast/inline spacing, native
effort-menu lower-edge and short-window selection, and generation-caption glyph
visibility. Its original overly strict mixed-baseline spacing assertion is
retained with an explicit predicate correction, not hidden as a product pass.
See `/tmp/harso-library-1498/final-independent/report.md` and final-gates logs.
No Pro, dependencies, backend, commits, merges, publication, or OS changes.

## WEV-1498 — native dismissal and concrete presentation repairs

AiChat now uses native dialog dismissal: modal and viewport-edge attached when
compact, nonmodal in the conversation grid when wide. `closedby="closerequest"`
routes Escape to the native cancel event; React requests host closure without
overriding refusal. The WeakSet, native method replacement and SyntheticEvent
flag rewriting are deleted. Native keyboard traversal may visit browser chrome;
outside page controls remain inert. This is native behavior, not strict Radix
focus-loop parity or an unsupported-browser guarantee.

Cached/conditional cancellation tests fail on the old source at both widths and
pass on the replacement. Forty-one affected unit cases and preview typecheck
pass; jsdom explicitly doubles dialog methods, with real behavior tested in
Chrome. The independent cancellation, refusal, property-integrity and repeated
open-menu resize challenge passes. A separate nested native-dialog test passes.
Compact and wide current native images were actually inspected.

The first expanded affected run records 58 passes and 12 failures: four former
Radix focus-loop assertions, four stale Social mark/description assertions, and
four geometry assertions sampling a still-running entrance animation. These
results are retained under `/tmp/harso-library-1498/dialog`. Test corrections
preserve the native inertness, actual supplied mark and settled-geometry claims;
the corrected focused reruns pass. A fresh combined affected run is recorded
separately under `final-gates`: **102 passed**, no retries or snapshot-baseline
comparisons. It covers the seven affected native drawer, AI consumer, dashboard,
workflow, citation and audio specs. No full-ready claim follows from this count.

Citation placement retains both failed hypotheses' observations. Viewport-center
fallback originally passed containment but broke slow pointer transfer across a
194px gap. Native bounded above/below fallback positions restore adjacency;
clamped anchor insets also contain the popup after offscreen-anchor resize.
All seven final focused cases pass, including slow pointer transfer and resize.
The original five-case pass does not erase the independently found pointer
failure. Final independent review under `citation/independent-bounded` passes
the original pointer path at both widths and the offscreen-trigger resize.
The earlier failing report remains under `citation/independent` unchanged.

VoiceSelector's shortcut retains its intrinsic width instead of shrinking its
letters into a vertical column: three long-name regressions and 32 affected
browser cases pass. AudioPlayer's actual native decode error now wraps long
diagnostic tokens, removing the grid's oversized minimum-content contribution.
Its 24 native local-WAV playback/error/recovery cases and nine unit cases pass;
removing the wrap rule in the browser reproduces overflow. No error text is
replaced or hidden, and valid-source recovery preserves the same audio node.

Fresh library-only unit validation passes 1,004 tests in 58 files, with UI
typecheck. Preview typecheck first found a test-only Node.remove typing error;
native parentNode.removeChild fixes it without changing production behavior.
The corrected preview typecheck and disposable production build pass. The build
retains the existing >500 kB chunk warning; output is under `final-gates/dist`,
not a deployed app. Original failures and corrected runs remain available.

Question selected state now survives the base Button cascade. Two selectors,
not a new state implementation, restore its intended outlined/selected paint.
The actual keyboard-selected gallery is RED before repair and GREEN across all
four paints afterward; six API-action tests pass. An independent single/multiple
consumer and CSS-removal challenge confirm the visible difference while keeping
aria-pressed intact. See `question-selection` and `visual42-final`.

Generation frame captions now have horizontal/bottom inset inside their existing
rounded clip. Eight focused cases cover five actual frame states in each paint
and width; six temporary padding-removal counterexamples reproduce clipping.
Twenty-two existing image/generation regressions and 28 unit tests pass. Native
workspace CSS, corner radii and image reveal remain unchanged. See
`image-caption-repair`; this supersedes only the caption hold in `image-surfaces`.

### Real-device evidence boundary

The remaining native obligations must not be closed by fixture counts, Axe or
mocked events. They require an explicitly authorized device session:

- Actual assistive-technology operation, names, state announcements and focus
  recovery for the 124 combined keyboard/focus/AT rows. Existing keyboard proof
  is reusable where source and behavior are unchanged; no repeated Cartesian
  suite is required merely to fill a count.
- Native OS-originated OTP autofill for both stated capabilities and the combined
  paste/autofill row. Programmatic input and clipboard pasting are not autofill.
- Real microphone permission/capture, listening, stop, denial and transcription
  through the named native speech paths. Their unobserved transient visual
  states remain part of this same gate, not evidence from fabricated callbacks.
- ChatStarter's Copy action uses the existing Snippet primitive; Read aloud is
  visibly unavailable because no speech-output consumer is connected. A working
  read-aloud claim needs a real supplied output path and observation, not merely
  the disabled button. This limitation remains explicit in the combined row.

This Build leaf does not authorize changing native OS settings or introducing
backend/runtime integrations. Source acceptance and releases remain separate
Land responsibilities. Pro is not needed for any of these outstanding checks.

## WEV-1497 — correction exhausted, routed; not full readiness

The capture-handoff hypothesis is exhausted, not the elapsed-time allowance.
Its native cancellation counterexample routes to a successor structural repair.
The immutable source and receipt are retained in `terminal/` under this leaf's
evidence directory. Existing passing checks do not override that failure.

The final Color forwarding repair passes 61 unit and eight browser cases;
Color and Contributions palette/layout/visual evidence closes six exact rows.
Additional source-bound Task, Tabs, StatCards, Avatar, BarList, Calendar and
first-family reviews close 22 rows. These are candidate evidence updates, not
new runtime integrations. Current review also exposes a narrow InlineCitation
popup overflow and a VoiceSelector shortcut wrapping defect; neither is waived.

Latest affected regression: `combined/browser.json` records **48 passed** across
image/gallery, navigation/menu, tooltip, notification lifecycle and input-state
specs. Snapshot comparisons were explicitly excluded, not approved. The repaired
dynamic React test typing passes preview typecheck. Guarding native popover
support before querying `:popover-open` restores all 18 affected unit cases.
Independent guard checks pass, but `popover-compatibility/independent/report.md`
retains a distinct counterexample: a consumer invoking a previously cached native
preventDefault method bypasses the temporary Escape handoff's cancellation
tracking. The workaround is not accepted as universally safe; repair remains open.

The enhanced eight-case Radar/Radial matrix covers 80 supplied mode/treatment/width
scenes. Independent reruns and an axis-color mutation support four additional
exact palette/visual rows. Shimmer's normal-motion gradient receives a separate
four-treatment check, actual visual review and independent gradient mutation.
Original CSS ripple and labeled Speech states satisfy reference capabilities,
not donor Canvas implementation or microphone-glyph parity. Those explicit
equivalence rulings do not waive native speech or assistive-technology proof.

Current accounting is in COVERAGE.md and coverage.json. Evidence remains under
`/tmp/harso-library-1497`; row histories retain earlier failures and limitations.
This is the original library, not a desktop migration, vendor-code import,
backend change, release, or Land acceptance. Pro is not required.

The first broad pass records 1,103 unit tests in 68 files, both typechecks and
a disposable build passing (existing >500 kB warning). Browser results are
760 passed / 3 failed, with no skips or retries, not an all-green suite.
Runtime/style/asset hashes matched across that run; two excluded worker specs
changed. Later source changes require affected regression, not blanket reuse.

The tooltip failure is a focus-induced ancestor scroll: the installed tooltip
intentionally dismisses on scroll. Giving the local clipping fixture a 1040px
viewport avoids that unrelated transition without changing production behavior.
Finance navigation and Sankey palette timeouts each pass two isolated repeats;
their original causes remain unclassified, not silently dismissed as flakes.

The native menu minimum-height repair prevents shrinking a menu below its action
and focus-outline height. Independent review reproduces clipping with that one
declaration removed and verifies repaired geometry at three viewport sizes.
Ten affected menu/tooltip regressions and five independent probes pass; see
`menu-height-review/report.md`. Nested gallery Escape remains a separate active
repair and is not covered by that passing claim.

Independent visual/state packets reconcile only exact supported rows. Screenshots
are distinguished from images actually inspected; DOM/Axe checks do not establish
actual assistive-technology behavior. Native OTP autofill, real speech compatibility
and combined assistive-technology obligations remain open where unevidenced.

## WEV-1496 — construction verification, not full readiness

Current reconciled accounting: **2,316 proven / 490 implemented-unverified /
35 not applicable**, preserving all 126 families and 2,841 immutable rows.
Newer worker proposals remain separate until reviewed and reconciled. Pro,
backend changes, commits, merges, and releases are not required or performed.

Evidence lives under `/tmp/harso-library-1496`. The first broad check passed
1,103 UI tests in 68 files. UI typecheck passed; preview typecheck initially
failed on a literal browser-only Vite import in a new test. Passing the module
URL into page.evaluate fixes that fixture typing; preview typecheck and the
disposable build then pass, with the existing >500 kB bundle warning.

Do not call the first browser run green: `final/browser.json` records
**734 passed / 12 failed**, no skips or retries. Expanded construction matrix
`matrix-expanded/construction-02/report.json` records **125 passed / 1 failed**.
CodeBlock overflow affected nine of those aggregate failures; a fragment put
its status paragraph beside the example in the gallery flex row. One outer
div fixes containment without hiding content. The existing ten focused tests
and the affected expanded-matrix case pass after repair.

Three interaction tests assumed wide, nonmodal workspace panels. They now
explicitly size the viewport and await noncompact layout before opening panels;
all original retained-state and disabled assertions remain. The nested-menu
failure was a real native anchor available-height defect, not a fixture issue.
The CSS repair and those test corrections pass the 46-case owned regression.
Pagination's fixed navigation controls pass layout checks, but independent
review found partially clipped keyboard focus; its correction remains under
verification. See `polish-independent/report.md` rather than inferring focus
acceptance from the earlier passing layout test.

Independent state/refusal reviews are retained under `work`, `content`,
`inputs`, `navigation`, `dashboards`, `conversation-mounted`, `ai-consumer-review`,
and `test-results/review`. The ten additional palette/layout proposals close
only their exact simple-family rows; `presentation-reconciliation/report.md`
records all holds. No assistive-technology claim follows from Axe or DOM checks.
Visual contact sheets and actual inspection reports are separate from captures;
unviewed or closed surfaces do not receive visual approval. Snapshot assertions
remain ignored, not accepted baselines. Later source manifests and regression
results must supersede these construction runs before final verification.

`Test` now supports complete custom compound children. When children are
omitted/null it retains the default status/name/duration/error composition;
supplied children replace that composition. Use `name` for a label-only override.
Known repository callers and both default/custom composition tests pass; this
is not a promise that arbitrary previous label-only children remain compatible.

## WEV-1493 — verified candidate, incomplete library acceptance

September 9, 2026 reconciliation of the September 8 execution. Current exact
accounting is **2,254 proven / 552 implemented-unverified / 35 not applicable**
across the unchanged 126 families and 2,841 requirements. `coverage.json` owns
row evidence; `REMAINING.md` enumerates every open row. This supersedes the
accounting in the historical checkpoints below, not their evidence.

The final browser run passed **630/630**, with zero skipped, unexpected or flaky
cases in `/tmp/harso-ready-1493/release-candidate-browser.json`. It started at
19:46:03 Singapore on September 8 and ran for 425.6 seconds. UI tests passed
**1,102 tests / 68 files**; UI and preview typechecks and the disposable preview
build passed. Logs are `release-candidate-ui.log` and
`release-candidate-build.log` in that same directory. The >500 kB build warning
remains. The artifact prefix does not authorize or represent a release.

`release-candidate-before.json` and `release-candidate-after.json` record 298
identical source/style/asset/spec entries. The latter manifest has SHA256
`b2c8c645d87c83c4d1991eae4da4ee5c63a0fa485b287388b3aa1c994e16c668`.
Documentation and coverage accounting are excluded from that runtime manifest.
The base remains `f973ec12abe7e2a222e3b88fdedf750dcadc0fa3`; the dirty candidate
is not an accepted commit or a landed build.

Historical failures remain retained: `full-browser.json` records 581 pass / 2
fail; `complete-browser.json` records 617 pass / 1 fail; `verified-browser.json`
is an interrupted run, not a successful gate. The final run uses
`--ignore-snapshots`: screenshots, accessibility scans, geometry and interaction
checks run, but screenshot baseline comparisons are neither passed nor approved.

The final shared hover repair restores trigger focus when a focused control
becomes natively disabled with no related focus target inside an open card.
This keeps citation endpoints readable and Escape operable for pointer and
keyboard use, without overriding controlled open-state refusal. The focused
keyboard regression failed before the final repair; `hover-keyboard-green.json`
records nine passing repetitions afterward. Earlier hover-only review evidence
does not alone verify the final keyboard recovery guard. The independent latest
review now passes seven real-browser cases in `hover-recovery-latest-review.json`,
including no-hover keyboard Next and Previous recovery. The updated
`hover-recovery-review.md` binds its scoped findings to inspected hashes.

### September 9 theme follow-up

The nested theme sample incorrectly defaulted to Clean when the gallery selected
Cozy. `Library.tsx` now forwards its existing palette through `NavigationExample`
to the existing provider; no new theme store or persistence was introduced.
`theme-live-red.log` reproduces expected Cozy / received Clean. The earlier
connection-refused attempt remains separately in `theme-live-unavailable.log`.

The live-System/explicit-Light/palette regression and existing sidebar checks
pass **6/6** in `theme-live-green.json`. The combined process exited zero after
preview typecheck; the subsequent preview build also passed with the existing
bundle warning. `theme-palette-review.md` records independent source review with
no blocking finding. These prove wiring/state, not all painted palettes or AT.

The post-follow-up 299-file `theme-followup-manifest.json` has SHA256
`89182224dc45f5537ac8bf8ad697b125d8bd563b60bc80dc6e8f71ae0e850ad5`.
Only `Library.tsx`, `navigation-examples.tsx` and the new
`boundaryless-theme-live.spec.ts` differ from the 630-case manifest. That 630
count belongs to the prior identity; only the six sensitive cases and preview
typecheck/build ran afterward. The UI package remains unchanged. Preview 4194
was restarted after its previous process exited; replacement session 56270 is
lead-owned. Post-check source hashes match the follow-up manifest.

Remaining obligations: 46 lifecycle, 124 combined keyboard/focus/actual
assistive-technology, 119 four-palette, 105 narrow/wide layout, 126 original
visual-review, 21 specific variant/interaction and 11 controlled/refusal rows.
Broad gallery rendering and Axe do not close those combined contracts. No Pro
purchase is needed. No runtime, backend, OS settings, dependency, commit, merge,
release, or Land acceptance is included. Preview 4194 and retained `/tmp`
artifacts remain in lead custody.

## WEV-1492 — second open checkpoint

September 8, 2026. Current accounting is **1,960 proven / 856
implemented-unverified / 25 not applicable**, preserving all 2,841 exact rows
across 126 families. Proven means the scoped requirement contract has cited
evidence, not that every rendered variant or whole family is accepted. All 126
original-design visual-review rows remain open. No Pro, runtime change, desktop
migration, commit, merge, release or Land acceptance is included.

Fresh post-repair checks: **1,094 UI tests / 67 files**, UI typecheck, preview
typecheck and disposable Vite build pass. Logs are `closeout-ui.log`,
`closeout-ui-typecheck.log`, `closeout-preview-typecheck.log` and
`closeout-build.log` under `/tmp/harso-verification-1492`. The existing >500 kB
bundle warning remains; this is not performance acceptance.

The first broad post-repair browser run records **471 passed / 1 failed** in
`closeout-browser.json`. The failure sampled a paused timer before its effect
cleanup committed the final elapsed-time sample. Two rendering-frame waits in
the browser test now precede pause/terminal snapshots; no timer producer is
changed, and the subsequent 350 ms freeze equality remains mandatory. The
focused check passes **12 repeated executions** in `timer-repeat.log`. This
does not erase the initial failing run. Independent `timer-review.md` accepts
settled-freeze proof only: two frames are not a guaranteed React effect barrier
or proof of instantaneous pause cutoff. The final broad rerun passes **472/472**
with zero unexpected, skipped or flaky cases in `verified-browser.json` and
`verified-browser.log` (17:10–17:15 Singapore). Historical screenshot assertions
were explicitly excluded with `--ignore-snapshots`; screenshot capture, Axe,
geometry and interaction checks still execute. No baseline was approved or updated.

Final source/spec identity: `verified-before.json` and `verified-after.json`
contain 269 identical entries, SHA256
`e40cf9b6a5f53c1cb9ea80a29cf64d50812223e5b8fe37ba90c19ba951a0d90f`.
The only change after the fresh UI/typecheck/build run is the browser timer
spec synchronization. All producer/style/unit-test bytes match that successful
run. Its earlier manifest, `closeout-after.json`, has SHA256
`0425c8a5d6c0431f30a21a0c0c28d11bacfebf357517e4d561acb572509b6515`.
Both identities are retained; neither is silently substituted for the other.

### Reproduced accessibility repair

The marketing funnel and medical sleep controls inherited numeric accessible
names from progress elements inside the same implicit label. Two real-browser
regressions first failed exact role/name lookup (`template-names-red.log`).
Changing the shared wrappers from label to div and matching two CSS selectors
fixes the root relationship without redundant button labels. Seven focused
browser cases pass (`template-names-green.log`), including exact names, Enter
activation and independently named progressbars. This is not screen-reader,
Tab-order, Space-key or exhaustive generated-control proof.

Exactly three original producer/style files changed: marketing-dashboard-example.tsx,
medical-profile-example.tsx and dashboard-surfaces.css. The four new unit test
files were extended, the template browser spec expanded, and the existing
agent-activity browser spec synchronized. Earlier claims that all 263 original
entries were unchanged apply only to their historical cutoff.

Independent findings and provenance corrections are retained in
`second-independent-review.md` and `second-review-corrections-result.json`.
The 20 charts/template rows explicitly qualify their historical identity and
attach fresh post-repair execution; marketing row 17 and medical row 18 also
carry the browser naming regression. Evidence history is not discarded.

### Remaining work

The 856 open rows include 105 variant details, 113 variants, 23 part/export
contracts, 38 interactions and 577 cross-cutting obligations. They are not all
device blockers: state matrices, controlled-host behavior, theme/layout and
visual reviews still need work. Actual assistive technology, unsupported-engine
fallbacks and physical media claims require their own real evidence. Native
silent-WAV playback tests do not establish generated audio or device audibility.
`REMAINING.md` is the complete itemized list. The same original 90-active-minute
budget remains in effect; this checkpoint is neither terminal nor a reset.

## WEV-1492 — historical 16:45 checkpoint

September 8, 2026. The following results and unchanged-source claims describe
the 16:45 checkpoint only, before subsequent test extensions and the three-file
accessible-name repair. The unchanged original design receives test/evidence closure,
not another implementation or whole-desktop migration. This is not a terminal
completion, Land acceptance, release, or claim that the entire library is ready.

### Results

| Check | Result | Evidence under /tmp/harso-verification-1492 |
|---|---|---|
| Full UI Vitest suite | 977 tests / 67 files pass | final-ui.log |
| UI and preview TypeScript | both pass | final-ui-typecheck.log; final-preview-typecheck.log |
| Expanded browser regression | 465 pass; zero failures/flaky/skipped | final-browser.json |
| Final strengthened audio suite | 17 pass, superseding the 17 earlier audio cases | audio-final.json |
| Additional template proof | 5 pass, seven disputed rows supported | template-evidence.json |
| Final source/test identity | 269 files unchanged around final UI/typechecks | final-candidate-before.json; final-candidate-after.json |

There are **470 distinct passing browser cases**, not 487: the later 17-case
audio run replaces the earlier audio subset. Installed headless Chrome is used
through Playwright against isolated local port4194. The 465-case regression
explicitly uses `--ignore-snapshots`; historical snapshot-baseline comparisons
remain unverified, not silently updated. Direct captures and non-snapshot
assertions still execute. No new browser engine, device setting or permission
is installed or enabled.

Final manifest SHA-256:
`374ab43dd91c3f6bed07e9fa92ba3427651ad27ab82a2ad8f0d687659ab9a79e`.
All 263 entries of the preceding candidate manifest remain byte-identical.
The six additions are four `verification-*.test.tsx` files, plus
`boundaryless-audio-native.spec.ts` and `boundaryless-template-evidence.spec.ts`.
The source/spec dependency subset captured before the broad browser run is in
`browser-before.json`; only its audio spec is subsequently strengthened and
rerun separately. Final template/audio specs are included in the 269-file
manifest. The earlier 267-file checkpoint is historical: two foundation test
assertions changed afterward and are covered by the final 977-test run.

The previous successful production Vite build is reused because no producer or
gallery source changed. The existing bundle-size warning is not a performance
pass. Base HEAD is still f973ec12abe7e2a222e3b88fdedf750dcadc0fa3; the tested dirty
candidate is identified by manifests, not by that HEAD alone.

### What the new proof establishes

- Native audio: supplied base64/MIME input and a URL source actually load silent
  synthetic PCM WAV data. Native metadata, playback-clock advancement,
  play/pause, backward/forward seek, mute and volume observations pass across
  Light/Dark × Clean/Cozy and 390/1440 widths. Invalid bytes fail visibly.
  These are not SDK-generation, real remote-service, microphone, physical
  speaker/headphone, audibility, or arbitrary-codec claims.
- Foundation: named size/tone/slot contracts, native activation, disabled and
  pending behavior, input serialization, host refusal and original equivalent
  export availability. Static export checks claim availability only.
- Prior/AI/developer: configurable questionnaire timing/defaults/custom labels,
  freeform questions, typed consumers, content compositions and helper behavior.
  Eight in-memory AI/developer behavior mutations are detected; a benign
  key-only mutation is honestly retained as an insensitive control.
- Templates/charts: page-one rows disappear and page-two rows appear before
  any filter/sort reset; actual attrition coordinates and sleep metric values
  reflect the supplied data. Additional chart hover, color/data updates and
  state boundaries are exercised by focused tests.

Independent review is recorded in `audio-independent-review.md` and
`reconciliation-review.md`. Seven originally overstated template claims require
the new focused browser assertions, not their old citations alone. Two audio
seek false-positive opportunities were tightened before the final 17-case run.
The initial HTTP fixture omitted range responses; a bare native Audio
reproduction isolated that harness issue. It was fixed in the test, not in the
component. An initial HR cell-name selector also included the employee role;
the final assertion targets exact employee text inside the table. Earlier
failure logs remain retained.

### Complete accounting and remaining work

**1,752 proven; 1,064 implemented-unverified; 25 not applicable.** All 307 earlier
candidate rows are reconciled rather than left in a separate parked category.
Compared with the previous checkpoint, 579 additional rows now have scoped
proof. All 2,841 original identities remain unchanged and evidence history is
preserved in `coverage.json`; the complete open list is `REMAINING.md`.

The 1,064 open rows comprise 199 variants, 191 variant details, 45 named parts,
52 interactions and 577 cross-cutting obligations. The latter include all126
original-design visual reviews, 124 combined keyboard/focus/assistive-technology
journeys, 119 full-theme obligations, 105 layout obligations, 72 combined
lifecycle-state obligations and 31 ownership/refusal obligations. These are
not all device blockers: runnable component proof and visual review still
remain. Actual AT, cross-engine fallbacks and real media/device behavior have
not been substituted with Axe, mocked APIs, default renders or synthetic WAVs.

No Pro purchase or new design approval blocks this work. WEV-1492 remains open;
this checkpoint does not claim budget exhaustion or completion. The lead owns
the isolated4194 preview and evidence. No existing user preview, backend,
runtime, release or Fable-owned source is changed.

## WEV-1489 — preceding candidate verification

September 8, 2026. This is local candidate evidence, not Land acceptance, a release,
or a claim that the full requirements checklist is closed.

## Final checks

| Check | Result | Evidence under /tmp/harso-parallel-library-0908 |
|---|---|---|
| UI Vitest suite | 882 tests / 63 files pass | final-candidate-ui-tests.log |
| UI TypeScript | pass | final-candidate-ui-typecheck.log |
| Preview TypeScript + disposable Vite build | pass; chunks over500kB still warn | final-candidate-build.log |
| All46 Boundaryless browser specs | 448 pass, zero failed/flaky/skipped | full-browser-final.json |
| Default gallery matrix, included in browser suite | 126 families ×8 appearance/palette/width combinations | boundaryless-library-coverage.spec.ts |
| Final source/test identity | all263 files unchanged around final tests/build | final-candidate-before.json / final-candidate-after.json |

Browser execution uses installed headless Chrome against isolated local4194.
The full run explicitly uses --ignore-snapshots: historical screenshot-baseline
comparisons are NOT certified or rewritten. Direct screenshots and Axe, geometry,
keyboard, interaction, state and responsive assertions still execute. Default
renders and scoped screenshots do not prove every variant or all visual parity.

Source-manifest SHA-256: 984357bf0e020177823e701c5d5afa86b67a387d0bd46b4cf487a5d490b213f7.
Base HEAD remains f973ec12abe7e2a222e3b88fdedf750dcadc0fa3 on
codex/desktop-conversation; tested source is the dirty candidate, not that HEAD.
The disposable build resides in /tmp/harso-parallel-library-0908/final-candidate-build.

## Reproduced and repaired findings

- Security challenge: sandbox allow-same-origin stripping and credential-bearing
  image URLs; original eight checks rechecked independently. See
  security-counterexamples-recheck.md for exact reviewed identities and limits.
- Foundation challenge: host date replacement/reset, focus after collection
  removal, and filtered-empty notification wording; original seven probes retained.
- Final browser regression: hidden notification status stayed exposed during
  visual exit. Closed notification/loader nodes now use aria-hidden and inert
  throughout the fade; four browser red cases precede the repair. Independent
  normal/reduced-motion × close/host-hidden probes pass. See
  security-review/presence-0205/recheck.md. Existing focus may clear on the next
  frames, not synchronously; no focus-restoration-to-host-target claim.
- Modal demo host-refusal switches were behind native modal backgrounds. The
  fixtures now expose switches inside the dialogs; their actual user paths pass.
- Upload tests now use the real attachment button/file chooser. Older fixed-port
  tests now use configured origin and retain strict external-request assertions.
- Settled-contrast audits await arrival opacity1; theme controls await native
  transition settlement. Axe rules and motion are not disabled to hide failures.

Earlier red logs and intermediate results remain intact. All final checks above
ran after these source repairs. Worker evidence remains scoped to its stated
assertions; it does not automatically cover later source changes.

## What remains open

Exact accounting across2841 rows:1173 proven,1336 implemented-unverified,
25 inapplicable with reasons,307 prior scoped candidate rows not reaccepted.
There are no rows currently classified missing; this is NOT full completion.
Independent coverage review explicitly downgraded29 combined keyboard/focus/
assistive-technology rows. Actual screen-reader sessions, cross-engine fallback,
real media/device permissions, exact outstanding variant/state/visual proofs and
reconciliation of earlier candidates remain open in REMAINING.md and coverage.json.
Desktop screen adoption and live runtime integration are separate from this kit.

## Custody

The dedicated4194 local library preview remains available for inspection. This
batch does not take over existing previews, publish, commit, merge, install
Pro/dependencies or modify backend/runtime contracts. All six support workers
have released ownership; the lead retains this candidate and the open checklist.
# Latest verification checkpoint — September 8, 2026

WEV-1492 continuation: 2,126 proven, 681 implemented-unverified, 34 justified
N/A across the unchanged 2,841 requirements / 126 families. Not library readiness
or Land acceptance. Later sections are historical checkpoints.

Full UI tests: 1,098 passed / 68 files. UI and preview typechecks and preview
production build exited successfully; build retains a chunk-size warning.
Full Chrome browser run: **511 passed, 1 failed**. PromptInput's test consumer
failed to discover its served CSS import URL; dependent promotions are withheld.
Snapshot baseline comparisons were ignored, not accepted. All 126 default
thumbnails were inspected; all-state/theme and real assistive-technology evidence
remain incomplete. Radar visible category mapping and sparse demos need follow-up.

Repairs: Confirmation preview placement, visible local Image example through the
existing sample helper, and close-icon size cascade. Frozen 275-file source/spec
manifest remained unchanged across the final checks: SHA256
`c8f51b10a61bee5f7b41abc615834f76f542a0fafade20d3851f5e52fc19e67b`.
Evidence: `/tmp/harso-readiness-1492/final-after.json`, final run logs/reports,
and `independent-review.md`. Documentation reconciliation follows that freeze.
Independent review rejected Table rows 20/24 N/A; both remain unverified.
Overlapping packet placeholders do not override positive exact evidence for
Agent 8, AgentThinking 28, Announcement 14, ComposerLoader 24/28; Carousel 25
retains the reviewed native-scroll applicability decision. No duplicates counted.
