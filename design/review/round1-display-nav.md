# Display + Navigation — independent strict visual review

Scope: all 62 indexed Light/Clean and Dark/Clean sheets (34 Display, 28 Navigation). Each original PNG was independently inspected with `vision_analyze`; tall Menu/Popover/Dialog/Sheet specimens received additional region inspection. Read-only review: no Sketch scripts, source changes, browser, or network.

Calibration: 8/10 = production-shippable with at most one minor nit; 7 = one clear defect; ≤6 = structural omission or multiple defects. Scores below are reviewer-calibrated against the brief, not the vision tool’s inconsistent “compressed scale” scores. Specimen-card whitespace, correct primary pills, generic imagery and illustrative data are not defects. Approximate geometry is visual, not a Sketch measurement. Contrast judgments are visual only; no numeric WCAG pass is claimed.

Reference coverage: inspected available desktop-light web PNGs for Avatar, Badge, Chip, Announcement, Notification, Tooltip, Divider, Carousel, Pagination, Breadcrumb, Tabs, SegmentedControl, Table, Typography, Sidebar, SettingsModal, NotificationCenter, and the Vercel Toolbar composition. References establish component content, not fixture controls. No direct PNG was found in shots3 for the other native families. Dark counterparts were each inspected separately, not inferred from light. Cozy sheets are outside this index/lane; no missing-Cozy penalty.

| sheet | score | defects (concrete, with approx px / which specimen) |
|---|---|---|
| Avatar — Light/Clean | Score: 6/10 | Online dot overlays initials in 24/32/40px specimens; move to perimeter with knockout ring. Group spacing alone not scored. |
| Avatar — Dark/Clean | Score: 6/10 | Online dot overlays initials in 24/32/40px specimens; move to perimeter with knockout ring. Group spacing alone not scored. |
| Badge — Light/Clean | Score: 6/10 | Working moved from second to last in both plain/dot rows versus reference; wrong state order. |
| Badge — Dark/Clean | Score: 6/10 | Working moved from second to last in both plain/dot rows versus reference; wrong state order. |
| Chip — Light/Clean | Score: 5/10 | Only neutral Working specimens; missing semantic Draft/Ready/Needs input/Couldn't finish matrix and leading status dots across Bold/Subtle/Caption. |
| Chip — Dark/Clean | Score: 5/10 | Only neutral Working specimens; missing semantic Draft/Ready/Needs input/Couldn't finish matrix and leading status dots across Bold/Subtle/Caption. |
| Announcement — Light/Clean | Score: 6/10 | Rich announcements omit close control and replace reference pill CTA with text link; title-only info specimen absent. |
| Announcement — Dark/Clean | Score: 6/10 | Rich announcements omit close control and replace reference pill CTA with text link; title-only info specimen absent. |
| Notification — Light/Clean | Score: 8/10 | No clipping/overlap; legible semantic glyphs and actions. Minor action-banner vertical balance nit. Timestamp absent versus design-direction banner pattern; reference toast also lacks timestamp, so not scored as missing toast state. |
| Notification — Dark/Clean | Score: 8/10 | No clipping/overlap; legible semantic glyphs and actions. Minor action-banner vertical balance nit. Timestamp absent versus design-direction banner pattern; reference toast also lacks timestamp, so not scored as missing toast state. |
| Tooltip — Light/Clean | Score: 6/10 | Both top/bottom tips are complete detached diamonds rather than merged triangles (zoom confirmed a visible background gap); incorrect pointer geometry. |
| Tooltip — Dark/Clean | Score: 6/10 | Both top/bottom tips are complete detached diamonds rather than merged triangles (zoom confirmed a visible background gap); incorrect pointer geometry. |
| Divider — Light/Clean | Score: 8/10 | No verified defect. Fixed-width left-aligned line specimens and low-contrast hairlines are intentional kit presentation, not truncation. |
| Divider — Dark/Clean | Score: 8/10 | No verified defect. Fixed-width left-aligned line specimens and low-contrast hairlines are intentional kit presentation, not truncation. |
| Carousel — Light/Clean | Score: 5/10 | Single card omits second-slide peek and first-slide Note input; indicator row does not demonstrate reference four-slide state. |
| Carousel — Dark/Clean | Score: 5/10 | Single card omits second-slide peek and first-slide Note input; indicator row does not demonstrate reference four-slide state. |
| Pagination — Light/Clean | Score: 6/10 | Missing compact prev/current/next specimen and double-sided truncation example; existing tail ellipsis renders cleanly. |
| Pagination — Dark/Clean | Score: 6/10 | Missing compact prev/current/next specimen and double-sided truncation example; existing tail ellipsis renders cleanly. |
| Breadcrumb — Light/Clean | Score: 6/10 | Reference leading home glyph and second-level avatar are absent; plain-text-only trail does not cover compound breadcrumb nodes. |
| Breadcrumb — Dark/Clean | Score: 6/10 | Reference leading home glyph and second-level avatar are absent; plain-text-only trail does not cover compound breadcrumb nodes. |
| Tabs — Light/Clean | Score: 6/10 | No disabled History-style tab or content-panel/input specimen from reference. Icon/count variants render cleanly; illustrative labels/counts not scored. |
| Tabs — Dark/Clean | Score: 6/10 | No disabled History-style tab or content-panel/input specimen from reference. Icon/count variants render cleanly; illustrative labels/counts not scored. |
| SegmentedControl — Light/Clean | Score: 6/10 | Three/four/icon/disabled rows are clean, but the reference two-option Comfortable/Compact control is absent (not a demand for different density sizes). |
| SegmentedControl — Dark/Clean | Score: 6/10 | Three/four/icon/disabled rows are clean, but the reference two-option Comfortable/Compact control is absent (not a demand for different density sizes). |
| Table — Light/Clean | Score: 6/10 | Reference Action column/eye actions and search control absent; only Work has sort affordance. Basic Source/Disposition example also absent. Existing hover/selected geometry is clean. |
| Table — Dark/Clean | Score: 6/10 | Reference Action column/eye actions and search control absent; only Work has sort affordance. Basic Source/Disposition example also absent. Existing hover/selected geometry is clean. |
| Typography — Light/Clean | Score: 6/10 | 16px Section tier absent from otherwise legible 24/20/15/14/13/12 scale; reference Display/Heading naming becomes Heading/Title. Missing tier, not missing redlines, drives score. |
| Typography — Dark/Clean | Score: 6/10 | 16px Section tier absent from otherwise legible 24/20/15/14/13/12 scale; reference Display/Heading naming becomes Heading/Title. Missing tier, not missing redlines, drives score. |
| Progress — Light/Clean | Score: 8/10 | No verified defect: linear 50%, three spinner sizes, circular 25/50/75 arcs are clean. Subdued inactive tracks are a minor visibility nit, not a measured contrast failure. |
| Progress — Dark/Clean | Score: 8/10 | No verified defect: linear 50%, three spinner sizes, circular 25/50/75 arcs are clean. Subdued inactive tracks are a minor visibility nit, not a measured contrast failure. |
| Disclosure — Light/Clean | Score: 8/10 | Closed/right and open/down chevrons align correctly. This is a disclosure-control specimen; lack of expanded body is noted but not scored without a family requirement. |
| Disclosure — Dark/Clean | Score: 8/10 | Closed/right and open/down chevrons align correctly. This is a disclosure-control specimen; lack of expanded body is noted but not scored without a family requirement. |
| EmptyState — Light/Clean | Score: 8/10 | No verified defect: internal icon/title/body/CTA stack is centered and legible. Its left placement within the wide specimen frame is not component misalignment. |
| EmptyState — Dark/Clean | Score: 8/10 | No verified defect: internal icon/title/body/CTA stack is centered and legible. Its left placement within the wide specimen frame is not component misalignment. |
| Menu — Light/Clean | Score: 6/10 | Submenu-open flyout aligns to parent menu top rather than Move to project trigger row (roughly 90–110px too high), with roughly 12–20px horizontal gap. Other rows, shortcut alignment and inset separators are clean. |
| Menu — Dark/Clean | Score: 6/10 | Submenu-open flyout aligns to parent menu top rather than Move to project trigger row (roughly 90–110px too high), with roughly 12–20px horizontal gap. Other rows, shortcut alignment and inset separators are clean. |
| Popover — Light/Clean | Score: 7/10 | Left/right pointers have a separate diamond/chevron silhouette and card border continues through arrow base; merge/mask border for one continuous floating-surface outline. |
| Popover — Dark/Clean | Score: 7/10 | Left/right pointers have a separate diamond/chevron silhouette and card border continues through arrow base; merge/mask border for one continuous floating-surface outline. |
| Sidebar — Light/Clean | Score: 6/10 | Reference announcement module absent; expanded view also lacks visible collapse control/header. Collapsed rail includes settings where expanded view ends with Library, weakening destination parity. |
| Sidebar — Dark/Clean | Score: 6/10 | Reference announcement module absent; expanded view also lacks visible collapse control/header. Collapsed rail includes settings where expanded view ends with Library, weakening destination parity. |
| SettingsModal — Light/Clean | Score: 6/10 | Reference checked notification preference becomes a dropdown, changing control semantics; Current plan banner absent. Two-column alignment and copy bounds are otherwise clean. |
| SettingsModal — Dark/Clean | Score: 6/10 | Reference checked notification preference becomes a dropdown, changing control semantics; Current plan banner absent. Two-column alignment and copy bounds are otherwise clean. |
| Dialog — Light/Clean | Score: 8/10 | No verified defect across alert/stacked/destructive/input, including zoomed lower specimens. Consistent spacing; primary pill and radius-8 input are compatible with authority. |
| Dialog — Dark/Clean | Score: 8/10 | No verified defect across alert/stacked/destructive/input, including zoomed lower specimens. Consistent spacing; primary pill and radius-8 input are compatible with authority. |
| Sheet — Light/Clean | Score: 8/10 | No verified defect in medium/full detents, including zoomed full-detent footer. Handle, close, body rows, activity and pinned Done remain unclipped. |
| Sheet — Dark/Clean | Score: 8/10 | No verified defect in medium/full detents, including zoomed full-detent footer. Handle, close, body rows, activity and pinned Done remain unclipped. |
| ActionSheet — Light/Clean | Score: 7/10 | Cancel is inset roughly 8px inside a second outlined rounded card, creating unnecessary double-container chrome within the action-sheet component. Separator starts are consistent after zoom (not a defect). |
| ActionSheet — Dark/Clean | Score: 7/10 | Cancel is inset roughly 8px inside a second outlined rounded card, creating unnecessary double-container chrome within the action-sheet component. Separator starts are consistent after zoom (not a defect). |
| NotificationCenter — Light/Clean | Score: 6/10 | Header unread count badge and All/Mentions/System filter row are absent versus reference. Grouped rows, timestamps and unread dots are clean. |
| NotificationCenter — Dark/Clean | Score: 6/10 | Header unread count badge and All/Mentions/System filter row are absent versus reference. Grouped rows, timestamps and unread dots are clean. |
| CommandPalette — Light/Clean | Score: 8/10 | No verified defect: grouped results, selected pill, search and right-aligned shortcuts are clean. Minor optical weight variance in shortcut glyphs only. |
| CommandPalette — Dark/Clean | Score: 8/10 | No verified defect: grouped results, selected pill, search and right-aligned shortcuts are clean. Minor optical weight variance in shortcut glyphs only. |
| Toolbar — Light/Clean | Score: 8/10 | Native document toolbar and overflow menu render without clipping or alignment defects. Vercel floating selection-toolbar reference is a different composition; lack of its Inspect/disabled Publish specimen is a coverage caveat, not confidently a native-toolbar defect. |
| Toolbar — Dark/Clean | Score: 8/10 | Native document toolbar and overflow menu render without clipping or alignment defects. Vercel floating selection-toolbar reference is a different composition; lack of its Inspect/disabled Publish specimen is a coverage caveat, not confidently a native-toolbar defect. |
| TabBar — Light/Clean | Score: 8/10 | No verified defect: five icon/label stacks align; Home has tonal selection; labels remain within rounded floating bar. |
| TabBar — Dark/Clean | Score: 8/10 | No verified defect: five icon/label stacks align; Home has tonal selection; labels remain within rounded floating bar. |
| SearchField — Light/Clean | Score: 8/10 | Default/typing/clear states remain aligned and unclipped; clear action and shortcut occupy stable right slot. Keeping shortcut while typing is not inherently a visual defect. |
| SearchField — Dark/Clean | Score: 8/10 | Default/typing/clear states remain aligned and unclipped; clear action and shortcut occupy stable right slot. Keeping shortcut while typing is not inherently a visual defect. |
| GroupBox — Light/Clean | Score: 8/10 | No verified defect: left labels/right values, dual chevrons and inset hairlines align. Subtle divider contrast follows design direction. |
| GroupBox — Dark/Clean | Score: 8/10 | No verified defect: left labels/right values, dual chevrons and inset hairlines align. Subtle divider contrast follows design direction. |
| Kbd — Light/Clean | Score: 8/10 | No verified defect: single/multi-glyph keycaps keep common height and centered glyphs, without clipping. Minor optical weight variation across glyphs. |
| Kbd — Dark/Clean | Score: 8/10 | No verified defect: single/multi-glyph keycaps keep common height and centered glyphs, without clipping. Minor optical weight variation across glyphs. |

## Below 8

- Carousel/Dark/Clean — Single card omits second-slide peek and first-slide Note input; indicator row does not demonstrate reference four-slide state.
- Carousel/Light/Clean — Single card omits second-slide peek and first-slide Note input; indicator row does not demonstrate reference four-slide state.
- Chip/Dark/Clean — Only neutral Working specimens; missing semantic Draft/Ready/Needs input/Couldn't finish matrix and leading status dots across Bold/Subtle/Caption.
- Chip/Light/Clean — Only neutral Working specimens; missing semantic Draft/Ready/Needs input/Couldn't finish matrix and leading status dots across Bold/Subtle/Caption.
- Announcement/Dark/Clean — Rich announcements omit close control and replace reference pill CTA with text link; title-only info specimen absent.
- Announcement/Light/Clean — Rich announcements omit close control and replace reference pill CTA with text link; title-only info specimen absent.
- Avatar/Dark/Clean — Online dot overlays initials in 24/32/40px specimens; move to perimeter with knockout ring. Group spacing alone not scored.
- Avatar/Light/Clean — Online dot overlays initials in 24/32/40px specimens; move to perimeter with knockout ring. Group spacing alone not scored.
- Badge/Dark/Clean — Working moved from second to last in both plain/dot rows versus reference; wrong state order.
- Badge/Light/Clean — Working moved from second to last in both plain/dot rows versus reference; wrong state order.
- Breadcrumb/Dark/Clean — Reference leading home glyph and second-level avatar are absent; plain-text-only trail does not cover compound breadcrumb nodes.
- Breadcrumb/Light/Clean — Reference leading home glyph and second-level avatar are absent; plain-text-only trail does not cover compound breadcrumb nodes.
- Menu/Dark/Clean — Submenu-open flyout aligns to parent menu top rather than Move to project trigger row (roughly 90–110px too high), with roughly 12–20px horizontal gap. Other rows, shortcut alignment and inset separators are clean.
- Menu/Light/Clean — Submenu-open flyout aligns to parent menu top rather than Move to project trigger row (roughly 90–110px too high), with roughly 12–20px horizontal gap. Other rows, shortcut alignment and inset separators are clean.
- NotificationCenter/Dark/Clean — Header unread count badge and All/Mentions/System filter row are absent versus reference. Grouped rows, timestamps and unread dots are clean.
- NotificationCenter/Light/Clean — Header unread count badge and All/Mentions/System filter row are absent versus reference. Grouped rows, timestamps and unread dots are clean.
- Pagination/Dark/Clean — Missing compact prev/current/next specimen and double-sided truncation example; existing tail ellipsis renders cleanly.
- Pagination/Light/Clean — Missing compact prev/current/next specimen and double-sided truncation example; existing tail ellipsis renders cleanly.
- SegmentedControl/Dark/Clean — Three/four/icon/disabled rows are clean, but the reference two-option Comfortable/Compact control is absent (not a demand for different density sizes).
- SegmentedControl/Light/Clean — Three/four/icon/disabled rows are clean, but the reference two-option Comfortable/Compact control is absent (not a demand for different density sizes).
- SettingsModal/Dark/Clean — Reference checked notification preference becomes a dropdown, changing control semantics; Current plan banner absent. Two-column alignment and copy bounds are otherwise clean.
- SettingsModal/Light/Clean — Reference checked notification preference becomes a dropdown, changing control semantics; Current plan banner absent. Two-column alignment and copy bounds are otherwise clean.
- Sidebar/Dark/Clean — Reference announcement module absent; expanded view also lacks visible collapse control/header. Collapsed rail includes settings where expanded view ends with Library, weakening destination parity.
- Sidebar/Light/Clean — Reference announcement module absent; expanded view also lacks visible collapse control/header. Collapsed rail includes settings where expanded view ends with Library, weakening destination parity.
- Table/Dark/Clean — Reference Action column/eye actions and search control absent; only Work has sort affordance. Basic Source/Disposition example also absent. Existing hover/selected geometry is clean.
- Table/Light/Clean — Reference Action column/eye actions and search control absent; only Work has sort affordance. Basic Source/Disposition example also absent. Existing hover/selected geometry is clean.
- Tabs/Dark/Clean — No disabled History-style tab or content-panel/input specimen from reference. Icon/count variants render cleanly; illustrative labels/counts not scored.
- Tabs/Light/Clean — No disabled History-style tab or content-panel/input specimen from reference. Icon/count variants render cleanly; illustrative labels/counts not scored.
- Tooltip/Dark/Clean — Both top/bottom tips are complete detached diamonds rather than merged triangles (zoom confirmed a visible background gap); incorrect pointer geometry.
- Tooltip/Light/Clean — Both top/bottom tips are complete detached diamonds rather than merged triangles (zoom confirmed a visible background gap); incorrect pointer geometry.
- Typography/Dark/Clean — 16px Section tier absent from otherwise legible 24/20/15/14/13/12 scale; reference Display/Heading naming becomes Heading/Title. Missing tier, not missing redlines, drives score.
- Typography/Light/Clean — 16px Section tier absent from otherwise legible 24/20/15/14/13/12 scale; reference Display/Heading naming becomes Heading/Title. Missing tier, not missing redlines, drives score.
- ActionSheet/Dark/Clean — Cancel is inset roughly 8px inside a second outlined rounded card, creating unnecessary double-container chrome within the action-sheet component. Separator starts are consistent after zoom (not a defect).
- ActionSheet/Light/Clean — Cancel is inset roughly 8px inside a second outlined rounded card, creating unnecessary double-container chrome within the action-sheet component. Separator starts are consistent after zoom (not a defect).
- Popover/Dark/Clean — Left/right pointers have a separate diamond/chevron silhouette and card border continues through arrow base; merge/mask border for one continuous floating-surface outline.
- Popover/Light/Clean — Left/right pointers have a separate diamond/chevron silhouette and card border continues through arrow base; merge/mask border for one continuous floating-surface outline.

## Cross-cutting

1. **Reference coverage is the main release blocker, not raster clipping.** Several families substitute a simpler look-alike rather than cover the existing web component: Chip semantic matrix, Carousel input/peek, Breadcrumb icon/avatar nodes, Tabs disabled/panel state, Table utilities, NotificationCenter filters/count, and SettingsModal checkbox semantics. Fix structural parity before cosmetic polishing. Reference fixture checkboxes/reset actions were deliberately excluded.
2. **Floating anchor geometry needs a shared fix.** Tooltip tips are detached full diamonds on both appearances. Popover left/right pointers retain a border across their base. Menu flyouts are top-aligned with the entire parent menu, rather than their triggering row. Fix the reusable anchor construction and test all orientations.
3. **Missing type/state coverage repeats across light and dark.** Typography lacks the 16px Section tier; Badge puts Working last, unlike the reference lifecycle order; SegmentedControl has no two-item example. These are parity gaps rather than light/dark color errors.
4. **Theme application is broadly sound.** Every reviewed dark sheet uses a dark canvas and readable light text; semantic accents and inverse primary controls are coherent. No default-grey structural-frame fill or verified text clipping was found. Exact 4.5:1 compliance cannot be certified visually.
5. **Distinguish presentation chrome from component defects.** Wide outer specimen frames naturally leave empty space to the right of fixed-width examples; do not “fix” Divider, EmptyState, Chip, etc. by stretching them to the whole sheet. ActionSheet’s nested Cancel wrapper is inside its actual component and is a genuine polish issue.
6. **Strong native foundations:** Dialog, Sheet, CommandPalette, TabBar, GroupBox and Kbd have clean spacing and readable hierarchy. These should not receive arbitrary 6–7 scores merely for subdued borders, static state representation or missing annotations.
7. **Unscored coverage caveats:** Notification lacks a timestamp in the general banner direction, but the actual reference toast has none; Disclosure demonstrates the control, not expanded content; native Toolbar does not reproduce Vercel’s distinct floating selection toolbar. Confirm family contracts before turning these into defects. The lane-directory lookup was permission-denied, so no extra family-state requirements were inferred from inaccessible files.

REVIEW_RESULT: 62 sheets 26 ≥8 36 <8
