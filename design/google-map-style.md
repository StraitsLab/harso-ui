# Google map style — V7 × Google

Import `google-map-style.json` (light) and `google-map-style.dark.json` (dark) using Google's [cloud JSON format](https://developers.google.com/maps/documentation/javascript/cloud-customization/json-reference). These are cloud styles, not legacy JavaScript `styles` arrays. The controller must publish/associate the variants with all four existing dev/prod web/iOS Map IDs. This PR does not change Google Cloud.

Colours come from the clean light/dark roles in `tokens/harso.tokens.json`: canvas land, surface roads, line buildings/park fill, accent-soft water, secondary labels. Re-export the two styles when those tokens change. Cloud cartography is shared; it cannot follow an individual user's tint. Card pins and route do follow the live tint in JavaScript/CSS.

Google's built-in zoom-dependent density is retained. Landmarks, attractions, parks and transit remain visible with muted kit labels/icons. Label opacity rises at z12/z15. Local street names start at z14; commerce labels/icons (retail, food, service, lodging) start at z15. Other street names remain. No blanket POI suppression.

After importing, select **building footprints** and **standard landmarks** in Map Settings; Google does not export those settings in JSON. Verify both variants on the actual vector Map IDs, including pin/Google-label collision and expanded Google landmark info windows. No browser key was available for this PR's proof; fake-SDK tests are not live Google acceptance.
