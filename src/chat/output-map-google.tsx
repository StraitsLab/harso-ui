/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../primitives";
import type { HarsoOutputGoogleMaps, HarsoOutputMap } from "./output-card-media";
import { watchMapColors } from "./output-map-colors";
import { decodePolyline, mapCoordinates } from "./output-map-utils";

let configured = "";

type Props = {
  map: HarsoOutputMap; selected?: string; group: string; onSelect: (id: string) => void; dark: boolean;
  expanded: boolean; google: HarsoOutputGoogleMaps; glyph: (category?: string) => React.ComponentType<{ size?: number; weight?: "bold"; "aria-hidden"?: "true" }>;
};

/** Google Maps surface: kit pins and route on Google cartography, drawn on Google's vector map.
 * Google place data may only be shown on a Google map, so hosts pass `google` once they serve Google results. */
export default function GoogleSurface({ map, selected, group, onSelect, dark, expanded, google, glyph }: Props) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [moved, setMoved] = useState(false);
  const recenter = useRef<() => void>(() => {});
  // Each Google map load is billed: create it only near the screen, once per mounted surface. Tint changes update polylines in place.
  const [near, setNear] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (near || !root.current) return;
    const watch = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) setNear(true); }, { rootMargin: "300px" });
    watch.observe(root.current);
    return () => watch.disconnect();
  }, [near]);
  const latest = useRef({ selected, onSelect });
  latest.current = { selected, onSelect };
  const sync = useRef<() => void>(() => {});
  const [view, setView] = useState<google.maps.Map | null>(null);
  const signature = JSON.stringify(map);
  useEffect(() => {
    if (!near) return;
    let active = true, dispose = () => {};
    setState("loading");
    const timer = window.setTimeout(() => { if (active) setState("failed"); }, 15000);
    const failed = () => { if (active) { window.clearTimeout(timer); setState("failed"); } };
    // Google reports a rejected key through this global callback only.
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = failed;
    if (configured !== google.key) { setOptions({ key: google.key, v: "weekly" }); configured = google.key; }
    Promise.all([importLibrary("maps"), importLibrary("core")]).then(([{ Map }, core]) => {
      if (!active || !canvas.current) return;
      const view = new Map(canvas.current, {
        mapId: google.mapId, center: { lat: 0, lng: 0 }, zoom: 10,
        colorScheme: dark ? core.ColorScheme.DARK : core.ColorScheme.LIGHT,
        disableDefaultUI: true
      });
      setView(view);
      const ready = google_once(view, "tilesloaded", () => { if (active) { window.clearTimeout(timer); setState("ready"); } });
      dispose = () => { ready.remove(); setView(null); };
    }).catch(failed);
    return () => { active = false; window.clearTimeout(timer); dispose(); };
    // Google's colorScheme is constructor-only; only a mode change may recreate a loaded map.
  }, [near, dark, attempt, google.key, google.mapId]);
  useEffect(() => {
    view?.setOptions({
      gestureHandling: expanded ? "greedy" : "cooperative",
      zoomControl: expanded, cameraControl: expanded, rotateControl: expanded,
      headingInteractionEnabled: expanded, tiltInteractionEnabled: expanded,
      clickableIcons: expanded, keyboardShortcuts: expanded
    });
  }, [view, expanded]);
  useEffect(() => {
    if (!view) return;
    let active = true, dispose = () => {};
    Promise.all([importLibrary("maps"), importLibrary("marker"), importLibrary("core")]).then(([{ Polyline }, { AdvancedMarkerElement, CollisionBehavior }, core]) => {
      if (!active || !canvas.current) return;
      const points = mapCoordinates(map).map(([lng, lat]) => ({ lat, lng }));
      const visible = map.places.slice(0, 12).map((place, index) => ({ place, index })).filter(({ place }) => group === "all" || place.category === group);
      const path = map.route?.path ? decodePolyline(map.route.path).map(([lng, lat]) => ({ lat, lng })) : [];
      const route = map.route ? path.length ? path : points : [];
      let fitting = true;
      let idle: google.maps.MapsEventListener | undefined;
      const fit = () => {
        fitting = true;
        setMoved(false);
        const fitPoints = group === "all" ? [...points, ...route] : visible.map(p => points[p.index]);
        if (!fitPoints.length) return;
        const bounds = new core.LatLngBounds();
        fitPoints.forEach(p => bounds.extend(p));
        view.fitBounds(bounds, { top: 50, bottom: 55, left: 48, right: 48 });
        idle?.remove();
        idle = google_once(view, "idle", () => { if ((view.getZoom() ?? 0) > MAX_FIT_ZOOM) view.setZoom(MAX_FIT_ZOOM); fitting = false; });
      };
      const markers = visible.map(({ place, index }) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "hkc-map-pin";
        if (map.route) button.textContent = String(index + 1);
        else { const Glyph = glyph(place.category); button.innerHTML = renderToStaticMarkup(<Glyph size={18} weight="bold" aria-hidden="true" />); }
        button.setAttribute("aria-label", `${map.route ? `${index + 1}. ` : ""}${place.label}`);
        button.title = place.label; button.dataset.id = place.id;
        const content = document.createElement("div");
        content.className = "hkc-map-marker"; content.append(button);
        button.addEventListener("click", () => latest.current.onSelect(place.id));
        return { id: place.id, button, marker: new AdvancedMarkerElement({ map: view, position: points[index], content, title: place.label, collisionBehavior: CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL }) };
      });
      // Names stay in the caption/list; Google handles collisions with its own labels.
      sync.current = () => {
        markers.forEach(m => {
          const on = m.id === latest.current.selected;
          m.button.setAttribute("aria-pressed", String(on));
          m.marker.zIndex = on ? 2 : 1;
        });
      };
      sync.current();
      const lines: google.maps.Polyline[] = [];
      const stopColors = watchMapColors(root.current!, colors => {
        const street = path.length > 1;
        const arrow = { path: core.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3.4, fillColor: colors.surface, fillOpacity: 1, strokeColor: colors.accent, strokeWeight: 1.5 };
        const dash = { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: colors.accent, scale: 3 };
        const styles = [
          { strokeColor: colors.surface, strokeWeight: 10, strokeOpacity: street ? 1 : 0 },
          { strokeColor: colors.accent, strokeWeight: 6, strokeOpacity: street ? 1 : 0,
            icons: street ? [{ icon: arrow, offset: "40px", repeat: "80px" }] : [{ icon: dash, offset: "0", repeat: "14px" }] }
        ];
        if (route.length > 1) styles.forEach((style, index) => {
          if (lines[index]) lines[index].setOptions(style);
          else lines.push(new Polyline({ map: view, path: route, clickable: false, ...style }));
        });
      });
      fit();
      const resize = new ResizeObserver(() => sync.current()); resize.observe(canvas.current);
      recenter.current = fit;
      const drag = view.addListener("dragstart", () => setMoved(true));
      const zoom = view.addListener("zoom_changed", () => { if (!fitting) setMoved(true); });
      dispose = () => { idle?.remove(); stopColors(); drag.remove(); zoom.remove(); resize.disconnect(); markers.forEach(m => { m.marker.map = null; }); lines.forEach(l => l.setMap(null)); };

    }).catch(() => { if (active) setState("failed"); });
    return () => { active = false; dispose(); sync.current = () => {}; recenter.current = () => {}; };
  }, [view, signature, group]);
  useEffect(() => { sync.current(); }, [selected]);
  return <div ref={root} className="hkc-map-surface" data-state={state} data-provider="google" aria-busy={state === "loading" || undefined}>
    <div ref={canvas} className="hkc-output-map-plane" role="region" aria-label="Interactive map" hidden={state === "failed"} />
    {state === "loading" && <div className="hkc-map-loading" role="status">Loading map…</div>}
    {state === "failed" ? <div className="hkc-map-failure" role="status"><p>Map unavailable. Explore the places in the list below.</p><Button variant="quiet" onClick={() => setAttempt(a => a + 1)}>Try again</Button></div>
      : moved && <Button variant="quiet" className="hkc-map-recenter" data-recenter onClick={() => recenter.current()}>Recenter</Button>}
  </div>;
}

/** Street level: two places 100 m apart sit about two pin widths apart, so neighbouring pins stay readable. */
const MAX_FIT_ZOOM = 16;

function google_once(view: google.maps.Map, event: string, callback: () => void) {
  const listener = view.addListener(event, () => { listener.remove(); callback(); });
  return listener;
}
