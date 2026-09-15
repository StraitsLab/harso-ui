# Display + Navigation — Round 2 independent strict visual review

**Verdict: not fully approved.** The named round-1 defects are resolved in both reviewed appearances, but fresh inspection identifies remaining release-quality defects in Menu, Sidebar and TabBar.

Scope: all 62 indexed sheets, Display and Navigation only (Light/Clean and Dark/Clean). All PNGs were decoded successfully and each was independently inspected with `vision_analyze`. Menu, Popover, Dialog and Sheet received additional region inspection; disputed Carousel, ActionSheet, TabBar and Sidebar details were rechecked in crops. Read-only: no Sketch scripts, source edits, browser or network.

Calibration: 8/10 is shippable with at most one minor nit, 7/10 one clear defect, ≤6 multiple/structural defects. Scores are reviewer-calibrated, not the vision tool’s arbitrary numeric scores. Geometry is approximate visual evidence; **no measured WCAG compliance is claimed**. Intentional specimen-card whitespace, inset separators, generic graphics, static animation and appropriate disabled styling are not penalized. No Cozy sheets are in scope.

References freshly inspected: desktop-light PNGs under `/tmp/harso-e/shots3/` for boardui Avatar, Badge, Chip, Announcement, Notification, Tooltip, Divider, Carousel, Pagination, Breadcrumb, Tabs, SegmentedControl, Table, Typography, Sidebar, SettingsModal, NotificationCenter; also vercel-toolbar. Reference fixture toggles/reset controls are excluded. No direct corresponding web PNG was found for the other native families. Dark sheets were each inspected directly, not inferred from light.

| sheet | score | defects (concrete, with approx px / which specimen) |
|---|---|---|
| Notification — Light/Clean | Score: 8/10 | No verified defect: all four semantic tones, compact/action variants, close controls and CTA remain legible and unclipped. Timestamp caveat remains unscored: web toast has none. |
| Notification — Dark/Clean | Score: 8/10 | No verified defect: all four semantic tones, compact/action variants, close controls and CTA remain legible and unclipped. Timestamp caveat remains unscored: web toast has none. |
| Divider — Light/Clean | Score: 8/10 | No verified defect: horizontal, labelled and vertical hairlines render cleanly. Fixed-width specimens inside wide presentation cards are intentional. |
| Divider — Dark/Clean | Score: 8/10 | No verified defect: horizontal, labelled and vertical hairlines render cleanly. Fixed-width specimens inside wide presentation cards are intentional. |
| Progress — Light/Clean | Score: 8/10 | No verified defect: linear 50%, three spinner sizes and circular 25/50/75% arcs are clean; static animation and subdued tracks are not defects. |
| Progress — Dark/Clean | Score: 8/10 | No verified defect: linear 50%, three spinner sizes and circular 25/50/75% arcs are clean; static animation and subdued tracks are not defects. |
| Disclosure — Light/Clean | Score: 8/10 | No verified defect: right/down chevrons, label baselines and clearances align. Control-only specimen; expanded-body coverage remains an unscored contract caveat. |
| Disclosure — Dark/Clean | Score: 8/10 | No verified defect: right/down chevrons, label baselines and clearances align. Control-only specimen; expanded-body coverage remains an unscored contract caveat. |
| EmptyState — Light/Clean | Score: 8/10 | No verified defect: icon/title/body/CTA share an internal center axis; no clipping. Left placement inside the presentation card is not misalignment. |
| EmptyState — Dark/Clean | Score: 8/10 | No verified defect: icon/title/body/CTA share an internal center axis; no clipping. Left placement inside the presentation card is not misalignment. |
| Avatar — Light/Clean | Score: 8/10 | R1 fixed: 24/32/40px online dots sit at the lower-right perimeter, clear of initials. Group overlap and glyph clearances are clean. |
| Avatar — Dark/Clean | Score: 8/10 | R1 fixed: 24/32/40px online dots sit at the lower-right perimeter, clear of initials. Group overlap and glyph clearances are clean. |
| Badge — Light/Clean | Score: 8/10 | R1 fixed: both rows read Draft → Working → Complete → Needs your input → Couldn't finish. Dots and labels align. |
| Badge — Dark/Clean | Score: 8/10 | R1 fixed: both rows read Draft → Working → Complete → Needs your input → Couldn't finish. Dots and labels align. |
| Chip — Light/Clean | Score: 8/10 | R1 fixed: all five semantic states and leading dots exist across Bold/Subtle/Caption; dismissible/icon variants retained. No clipping. |
| Chip — Dark/Clean | Score: 8/10 | R1 fixed: all five semantic states and leading dots exist across Bold/Subtle/Caption; dismissible/icon variants retained. No clipping. |
| Announcement — Light/Clean | Score: 8/10 | R1 fixed: rich specimens include top-right close and pill CTA; title-only info specimen added. Padding and content bounds are clean. |
| Announcement — Dark/Clean | Score: 8/10 | R1 fixed: rich specimens include top-right close and pill CTA; title-only info specimen added. Padding and content bounds are clean. |
| Tooltip — Light/Clean | Score: 8/10 | R1 fixed: top/bottom pointers are connected triangular protrusions, not detached diamonds. Clean inverse text and continuous silhouette. |
| Tooltip — Dark/Clean | Score: 8/10 | R1 fixed: top/bottom pointers are connected triangular protrusions, not detached diamonds. Clean inverse text and continuous silhouette. |
| Carousel — Light/Clean | Score: 8/10 | R1 fixed: first slide has Note input; second-slide peek present; one active pill plus three dots demonstrates four slides. Zoom found no confirmed mismatched-color mask artifact; partial next-card text is intentional viewport clipping. |
| Carousel — Dark/Clean | Score: 8/10 | R1 fixed: first slide has Note input; second-slide peek present; one active pill plus three dots demonstrates four slides. Zoom found no confirmed mismatched-color mask artifact; partial next-card text is intentional viewport clipping. |
| Pagination — Light/Clean | Score: 8/10 | R1 fixed: compact prev/current/next and bilateral ellipsis specimens added; existing tail example clean. No label collisions. |
| Pagination — Dark/Clean | Score: 8/10 | R1 fixed: compact prev/current/next and bilateral ellipsis specimens added; existing tail example clean. No label collisions. |
| Breadcrumb — Light/Clean | Score: 8/10 | R1 fixed: root home icon and second-node HL avatar present; terminal label differentiated and chevron gaps clean. |
| Breadcrumb — Dark/Clean | Score: 8/10 | R1 fixed: root home icon and second-node HL avatar present; terminal label differentiated and chevron gaps clean. |
| Tabs — Light/Clean | Score: 8/10 | R1 fixed: visibly disabled History and Overview content panel with Draft title input added; underline/icon/count examples remain unclipped. |
| Tabs — Dark/Clean | Score: 8/10 | R1 fixed: visibly disabled History and Overview content panel with Draft title input added; underline/icon/count examples remain unclipped. |
| SegmentedControl — Light/Clean | Score: 8/10 | R1 fixed: Comfortable/Compact two-option row added; three/four/icon/disabled variants remain aligned and unclipped. |
| SegmentedControl — Dark/Clean | Score: 8/10 | R1 fixed: Comfortable/Compact two-option row added; three/four/icon/disabled variants remain aligned and unclipped. |
| Table — Light/Clean | Score: 8/10 | R1 fixed: Source/Disposition example, search, Action eye icons and both Work/Sources sort affordances now present. Hover/selected rows and columns align; fixed-width rules are not truncation. |
| Table — Dark/Clean | Score: 8/10 | R1 fixed: Source/Disposition example, search, Action eye icons and both Work/Sources sort affordances now present. Hover/selected rows and columns align; fixed-width rules are not truncation. |
| Typography — Light/Clean | Score: 8/10 | R1 fixed: Section · 16 added and Display · 24 / Heading · 20 names restored. Scale is legible with clean two-column alignment. |
| Typography — Dark/Clean | Score: 8/10 | R1 fixed: Section · 16 added and Display · 24 / Heading · 20 names restored. Scale is legible with clean two-column alignment. |
| Dialog — Light/Clean | Score: 8/10 | No verified defect across alert/stacked/destructive/input; lower-region zoom confirms body text, input and action footers are unclipped. |
| Dialog — Dark/Clean | Score: 8/10 | No verified defect across alert/stacked/destructive/input; lower-region zoom confirms body text, input and action footers are unclipped. |
| Sheet — Light/Clean | Score: 8/10 | No verified defect across medium/full detents; handles, close controls and pinned Done footers clean. Full-detent whitespace is intentional; crop-edge header cutoff is not source clipping. |
| Sheet — Dark/Clean | Score: 8/10 | No verified defect across medium/full detents; handles, close controls and pinned Done footers clean. Full-detent whitespace is intentional; crop-edge header cutoff is not source clipping. |
| CommandPalette — Light/Clean | Score: 8/10 | No verified defect: grouped results, selected tonal pill, search and shortcuts align. Bare row shortcuts versus header/footer keycaps serve different hierarchy levels. |
| CommandPalette — Dark/Clean | Score: 8/10 | No verified defect: grouped results, selected tonal pill, search and shortcuts align. Bare row shortcuts versus header/footer keycaps serve different hierarchy levels. |
| Toolbar — Light/Clean | Score: 8/10 | Native document toolbar/overflow geometry is clean, including right-edge flyout anchor and inset separator. Minor nit: open overflow trigger has little state differentiation. Vercel contextual-toolbar coverage remains unscored. |
| Toolbar — Dark/Clean | Score: 8/10 | Native document toolbar/overflow geometry is clean, including right-edge flyout anchor and inset separator. Minor nit: open overflow trigger has little state differentiation. Vercel contextual-toolbar coverage remains unscored. |
| TabBar — Light/Clean | Score: 7/10 | NEWLY IDENTIFIED: four inactive icon/label stacks are left-aligned rather than centered; icon centers sit roughly 8–16px left of label centers (most obvious Projects). Active Home is centered. Confirmed by zoom in both appearances; no clipping. |
| TabBar — Dark/Clean | Score: 7/10 | NEWLY IDENTIFIED: four inactive icon/label stacks are left-aligned rather than centered; icon centers sit roughly 8–16px left of label centers (most obvious Projects). Active Home is centered. Confirmed by zoom in both appearances; no clipping. |
| SearchField — Light/Clean | Score: 8/10 | No verified defect: stable leading/trailing slots, typing focus treatment and clear action; shortcut remaining while typing is not inherently a visual defect. |
| SearchField — Dark/Clean | Score: 8/10 | No verified defect: stable leading/trailing slots, typing focus treatment and clear action; shortcut remaining while typing is not inherently a visual defect. |
| GroupBox — Light/Clean | Score: 8/10 | No verified defect: label/value columns, dual chevrons and inset hairlines align; no text clipping. |
| GroupBox — Dark/Clean | Score: 8/10 | No verified defect: label/value columns, dual chevrons and inset hairlines align; no text clipping. |
| Kbd — Light/Clean | Score: 8/10 | No clear defect: uniform keycap heights and balanced horizontal padding. Minor optical glyph-center variation around 1–2px (caret/lowercase), not clipping. |
| Kbd — Dark/Clean | Score: 8/10 | No clear defect: uniform keycap heights and balanced horizontal padding. Minor optical glyph-center variation around 1–2px (caret/lowercase), not clipping. |
| Menu — Light/Clean | Score: 7/10 | R1 anchor fixed: flyout moved down to trigger neighborhood, gap roughly 6–8px instead of 12–20px. NEWLY IDENTIFIED: submenu-open specimen still highlights Duplicate instead of Move to project (one 32px row above). Move the parent tonal pill to the actual open trigger. |
| Menu — Dark/Clean | Score: 7/10 | R1 anchor fixed: flyout moved down to trigger neighborhood, gap roughly 6–8px instead of 12–20px. NEWLY IDENTIFIED: submenu-open specimen still highlights Duplicate instead of Move to project (one 32px row above). Move the parent tonal pill to the actual open trigger. |
| Popover — Light/Clean | Score: 8/10 | R1 fixed: left/right pointer base borders and diamond silhouette gone; zoom confirms continuous outlined triangles with no seams/clipped tips. Top/bottom variants also clean. |
| Popover — Dark/Clean | Score: 8/10 | R1 fixed: left/right pointer base borders and diamond silhouette gone; zoom confirms continuous outlined triangles with no seams/clipped tips. Top/bottom variants also clean. |
| Sidebar — Light/Clean | Score: 7/10 | R1 announcement/header-collapse/destination-parity defects fixed. NEWLY IDENTIFIED: collapsed rail lacks an explicit expand-sidebar affordance; top icon is workspace layers, then search/home, not the matching pane toggle. Add a visible reverse control. No clipping. |
| Sidebar — Dark/Clean | Score: 7/10 | R1 announcement/header-collapse/destination-parity defects fixed. NEWLY IDENTIFIED: collapsed rail lacks an explicit expand-sidebar affordance; top icon is workspace layers, then search/home, not the matching pane toggle. Add a visible reverse control. No clipping. |
| SettingsModal — Light/Clean | Score: 8/10 | R1 fixed: Current plan banner and checked notification checkbox restored; no dropdown substitution. Two-column controls and footer align without clipping. |
| SettingsModal — Dark/Clean | Score: 8/10 | R1 fixed: Current plan banner and checked notification checkbox restored; no dropdown substitution. Two-column controls and footer align without clipping. |
| ActionSheet — Light/Clean | Score: 8/10 | R1 fixed: zoom confirms Cancel has ONE boundary, not a button inset inside another rounded wrapper. Separate Cancel surface below the main action group is correct; no clipping. |
| ActionSheet — Dark/Clean | Score: 8/10 | R1 fixed: zoom confirms Cancel has ONE boundary, not a button inset inside another rounded wrapper. Separate Cancel surface below the main action group is correct; no clipping. |
| NotificationCenter — Light/Clean | Score: 8/10 | R1 fixed: unread badge 2 and All/Mentions/System filter row present; two unread dots agree with count. Grouped rows/timestamps and header remain unclipped. |
| NotificationCenter — Dark/Clean | Score: 8/10 | R1 fixed: unread badge 2 and All/Mentions/System filter row present; two unread dots agree with count. Grouped rows/timestamps and header remain unclipped. |

## Below 8

- Menu/Light/Clean — R1 anchor fixed: flyout moved down to trigger neighborhood, gap roughly 6–8px instead of 12–20px. NEWLY IDENTIFIED: submenu-open specimen still highlights Duplicate instead of Move to project (one 32px row above). Move the parent tonal pill to the actual open trigger.
- Menu/Dark/Clean — R1 anchor fixed: flyout moved down to trigger neighborhood, gap roughly 6–8px instead of 12–20px. NEWLY IDENTIFIED: submenu-open specimen still highlights Duplicate instead of Move to project (one 32px row above). Move the parent tonal pill to the actual open trigger.
- Sidebar/Light/Clean — R1 announcement/header-collapse/destination-parity defects fixed. NEWLY IDENTIFIED: collapsed rail lacks an explicit expand-sidebar affordance; top icon is workspace layers, then search/home, not the matching pane toggle. Add a visible reverse control. No clipping.
- Sidebar/Dark/Clean — R1 announcement/header-collapse/destination-parity defects fixed. NEWLY IDENTIFIED: collapsed rail lacks an explicit expand-sidebar affordance; top icon is workspace layers, then search/home, not the matching pane toggle. Add a visible reverse control. No clipping.
- TabBar/Light/Clean — NEWLY IDENTIFIED: four inactive icon/label stacks are left-aligned rather than centered; icon centers sit roughly 8–16px left of label centers (most obvious Projects). Active Home is centered. Confirmed by zoom in both appearances; no clipping.
- TabBar/Dark/Clean — NEWLY IDENTIFIED: four inactive icon/label stacks are left-aligned rather than centered; icon centers sit roughly 8–16px left of label centers (most obvious Projects). Active Home is centered. Confirmed by zoom in both appearances; no clipping.

## Round-1 defect reconciliation

**No named round-1 scored defect remains unchanged.** The following resolution checks apply separately to **both Light/Clean and Dark/Clean**. “Newly identified” means absent from the R1 defect list; it is not a claim that the fix wave introduced it.

| R1 family | R1 named defect(s) | R2 status |
|---|---|---|
| Avatar | Online dots overlap initials at 24/32/40px | Resolved: perimeter dots clear initials. |
| Badge | Working placed last in both rows | Resolved: Working is second in both. |
| Chip | Semantic matrix and leading dots missing | Resolved: all five states across Bold/Subtle/Caption with dots. |
| Announcement | Close missing, text-link CTA instead of pill, title-only info absent | All resolved. |
| Tooltip | Detached diamond tips / background gap | Resolved: continuous triangles in both directions. |
| Carousel | Note input, second-slide peek and four-slide indicator state absent | All resolved. Intentional peek clipping is not a repeat defect. |
| Pagination | Compact and bilateral-truncation specimens absent | Both resolved. |
| Breadcrumb | Home and avatar compound nodes missing | Both resolved. |
| Tabs | Disabled History and panel/input missing | Both resolved. |
| SegmentedControl | Two-option example missing | Resolved: Comfortable/Compact. |
| Table | Search, eye actions, second sort affordance and basic example missing | All resolved. |
| Typography | 16px Section absent; Display/Heading renamed | Both resolved. Remaining Body/Secondary/Caption/Mono labels are not newly scored omissions of type tiers. |
| Menu | Flyout aligned to parent top, excessive horizontal gap | Resolved: moved down to trigger neighborhood with roughly 6–8px gap. Family still fails because Duplicate is highlighted while Move to project is open. |
| Popover | Left/right diamond silhouette and base border | Resolved; zoom shows unified outline. |
| Sidebar | Announcement and expanded header/collapse absent; rail settings/library mismatch | All resolved. Family still fails because collapsed-state reverse affordance is absent. |
| SettingsModal | Checkbox replaced by dropdown; Current plan absent | Both resolved. |
| ActionSheet | Cancel inset inside an extra outlined wrapper | Resolved: one Cancel boundary. Main action card plus separate Cancel is not double-wrapper chrome. |
| NotificationCenter | Header count and filter row missing | Both resolved. |

R1 unscored caveats remain unscored: Notification timestamp versus toast contract; Disclosure expanded content versus control-only family; native Toolbar versus Vercel contextual selection-toolbar composition. These do not imply unverified completion of behavior or library coverage.

## Cross-cutting

1. **The fix wave materially closes reference parity.** Semantic matrices, compound nodes, supplementary states and missing subcomponents are now visible in both appearances. No residual R1 missing-state blocker is confirmed.
2. **Open/collapsed state coherence is the main remaining issue.** Menu now anchors its flyout correctly but highlights the wrong parent row. Sidebar restores collapse but provides no explicit inverse affordance in the rail. Review state pairs together rather than validating each silhouette alone.
3. **TabBar has a shared stack-alignment defect missed by R1.** Its inactive icons align to label starts instead of centers, whereas active Home is centered. Correct the shared item alignment; do not attempt to compensate with per-icon offsets. Whole-bar edge comparisons between a selection pill and bare text are not reliable evidence of slot-spacing defects, so no separate padding penalty is applied.
4. **Pointer construction is substantially improved.** Tooltip and Popover outlines are continuous; ActionSheet’s Cancel wrapper is reduced correctly. Crop verification was necessary to avoid falsely carrying forward the original defects.
5. **Dark/light parity is strong.** The same concrete remaining defects occur in both. No wrong-appearance fill, accidental grey structural frame, or confirmed text clipping was found. Some muted text warrants token-level contrast measurement, but raster impression alone does not establish a numeric failure.
6. **Do not confuse intentional masking or presentation with defects.** Carousel has a fixed-width peek viewport inside a wider specimen card; cropped next-slide text is expected. Divider/Table fixed-width rules and Sheet pinned-footer whitespace are not truncation. Inset menu separators are explicitly required, not asymmetry defects.
7. **Native foundations remain shippable.** Dialog, Sheet, CommandPalette, SearchField, GroupBox and Kbd retain clean geometry. Toolbar’s weak open-trigger differentiation is a minor nit, unlike Menu’s contradictory highlighted action.

REVIEW_RESULT: 62 sheets 56 ≥8 6 <8
