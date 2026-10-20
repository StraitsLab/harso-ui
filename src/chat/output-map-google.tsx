/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../primitives";
import type { HarsoOutputGoogleMaps, HarsoOutputMap } from "./output-card-media";
import { decodePolyline, mapCoordinates } from "./output-map-utils";

let configured = "";

type Props = {
  map: HarsoOutputMap; selected?: string; group: string; onSelect: (id: string) => void; dark: boolean;
  google: HarsoOutputGoogleMaps; colors: string[]; glyph: (category?: string) => React.ComponentType<{ size?: number; weight?: "bold"; "aria-hidden"?: "true" }>;
};

/** Google Maps surface: same pins, labels, route and controls as the open map, drawn on Google's vector map.
 * Google place data may only be shown on a Google map, so hosts pass `google` once they serve Google results. */
export default function GoogleSurface({ map, selected, group, onSelect, dark, google, colors, glyph }: Props) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  // Each Google map load is billed: create it only near the screen, once per card (expand reuses this surface).
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
    Promise.all([importLibrary("maps"), importLibrary("marker"), importLibrary("core")]).then(([{ Map, Polyline }, { AdvancedMarkerElement }, core]) => {
      if (!active || !canvas.current) return;
      const points = mapCoordinates(map).map(([lng, lat]) => ({ lat, lng }));
      const categories = [...new Set(map.places.map(p => p.category).filter(Boolean))];
      const visible = map.places.slice(0, 12).map((place, index) => ({ place, index })).filter(({ place }) => group === "all" || place.category === group);
      const path = map.route?.path ? decodePolyline(map.route.path).map(([lng, lat]) => ({ lat, lng })) : [];
      const route = map.route ? path.length ? path : points : [];
      const view = new Map(canvas.current, {
        mapId: google.mapId, center: points[0], zoom: 10, colorScheme: dark ? core.ColorScheme.DARK : core.ColorScheme.LIGHT,
        gestureHandling: "cooperative", disableDefaultUI: true, zoomControl: true, clickableIcons: false, keyboardShortcuts: true,
        zoomControlOptions: { position: core.ControlPosition.RIGHT_TOP }
      });
      const fit = () => {
        const fitPoints = group === "all" ? [...points, ...route] : visible.map(p => points[p.index]);
        if (!fitPoints.length) return;
        const bounds = new core.LatLngBounds();
        fitPoints.forEach(p => bounds.extend(p));
        view.fitBounds(bounds, { top: 115, bottom: 80, left: 80, right: 80 });
        google_once(view, "idle", () => { if ((view.getZoom() ?? 0) > 14) view.setZoom(14); });
      };
      const markers = visible.map(({ place, index }) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "hkc-map-pin";
        if (map.route) button.textContent = String(index + 1);
        else { const Glyph = glyph(place.category); button.innerHTML = renderToStaticMarkup(<Glyph size={18} weight="bold" aria-hidden="true" />); }
        button.setAttribute("aria-label", `${map.route ? `${index + 1}. ` : ""}${place.label}`);
        button.title = place.label; button.dataset.id = place.id;
        button.style.setProperty("--pin-color", map.route ? colors[0] : colors[Math.max(0, categories.indexOf(place.category)) % colors.length]);
        const label = document.createElement("span");
        label.className = "hkc-map-label hkc-map-label-google"; label.setAttribute("aria-hidden", "true");
        label.textContent = `${map.route ? `${index + 1} · ` : ""}${place.label}`;
        const content = document.createElement("div");
        content.className = "hkc-map-marker"; content.append(button, label);
        button.addEventListener("click", () => latest.current.onSelect(place.id));
        return { id: place.id, label, button, marker: new AdvancedMarkerElement({ map: view, position: points[index], content, title: place.label }) };
      });
      // Google's map already names landmarks, so a second label for every pin doubles the text. Name only the
      // selected stop; the list below the map names every place.
      sync.current = () => {
        markers.forEach(m => {
          const on = m.id === latest.current.selected;
          m.button.setAttribute("aria-pressed", String(on));
          m.label.hidden = !on;
          m.marker.zIndex = on ? 2 : 1;
        });
      };
      sync.current();
      const lines: google.maps.Polyline[] = [];
      if (route.length > 1) {
        const street = path.length > 1;
        lines.push(new Polyline({ map: view, path: route, strokeColor: dark ? "#0b1412" : "#ffffff", strokeWeight: 10, strokeOpacity: street ? 1 : 0, clickable: false }));
        // Arrows show direction, stop 1 to the last stop; straight lines are dashed so they never pass for streets.
        const arrow = { path: core.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3.4, fillColor: "#ffffff", fillOpacity: 1, strokeColor: dark ? "#0b1412" : "#1d5a4a", strokeWeight: 1.5 };
        const dash = { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: dark ? "#87ceba" : "#287561", scale: 3 };
        lines.push(new Polyline({ map: view, path: route, clickable: false, strokeColor: dark ? "#9be3cf" : "#287561", strokeWeight: 6,
          strokeOpacity: street ? 1 : 0,
          icons: street ? [{ icon: arrow, offset: "40px", repeat: "80px" }] : [{ icon: dash, offset: "0", repeat: "14px" }] }));
      }
      google_once(view, "tilesloaded", () => { if (active) { window.clearTimeout(timer); setState("ready"); } });
      fit();
      const resize = new ResizeObserver(() => sync.current()); resize.observe(canvas.current);
      const button = root.current?.querySelector<HTMLButtonElement>("[data-recenter]");
      if (button) button.onclick = fit;
      dispose = () => { resize.disconnect(); if (button) button.onclick = null; markers.forEach(m => { m.marker.map = null; }); lines.forEach(l => l.setMap(null)); };
    }).catch(failed);
    return () => { active = false; window.clearTimeout(timer); dispose(); };
  }, [signature, group, dark, attempt, near, google.key, google.mapId]);
  useEffect(() => { sync.current(); }, [selected]);
  return <div ref={root} className="hkc-map-surface" data-state={state} data-provider="google" aria-busy={state === "loading" || undefined}>
    <div ref={canvas} className="hkc-output-map-plane" role="region" aria-label="Interactive map" hidden={state === "failed"} />
    {state === "loading" && <div className="hkc-map-loading" role="status">Loading map…</div>}
    {state === "failed" ? <div className="hkc-map-failure" role="status"><p>Map unavailable. Explore the places in the list below.</p><Button variant="quiet" onClick={() => setAttempt(a => a + 1)}>Try again</Button></div>
      : <Button variant="quiet" className="hkc-map-recenter" data-recenter>Recenter</Button>}
  </div>;
}

function google_once(view: google.maps.Map, event: string, callback: () => void) {
  const listener = view.addListener(event, () => { listener.remove(); callback(); });
}
