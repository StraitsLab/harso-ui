"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as LibreMap } from "maplibre-gl";
import { Button } from "../primitives";
import { MapPin } from "@phosphor-icons/react";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { HarsoOutputMap, HarsoOutputMediaHost } from "./output-card-media";
import { HarsoOutputThumb } from "./output-card-media";
import { decodePolyline, mapBounds, mapCoordinates } from "./output-map-utils";
import { vectorStyle } from "./output-map-style";
import "maplibre-gl/dist/maplibre-gl.css";
import "./output-map.css";

const COLORS = ["#287561", "#815eb0", "#ad5433", "#336d9f"];
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type SurfaceProps = { map: HarsoOutputMap; selected?: string; group: string; onSelect: (id: string) => void; dark: boolean };

function MapSurface({ map, selected, group, onSelect, dark }: SurfaceProps) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null);
  const instance = useRef<LibreMap | null>(null);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const latest = useRef({ selected, onSelect });
  latest.current = { selected, onSelect };
  const signature = JSON.stringify(map);
  useEffect(() => {
    let active = true, dispose = () => {};
    setState("loading");
    const timer = window.setTimeout(() => { if (active) setState("failed"); }, 15000);
    import("maplibre-gl").then(lib => {
      if (!active || !canvas.current) return;
      lib.setWorkerUrl(workerUrl);
      const points = mapCoordinates(map);
      const categories = [...new Set(map.places.map(p => p.category).filter(Boolean))];
      const visible = map.places.slice(0, 12).map((place, index) => ({ place, index })).filter(({ place }) => group === "all" || place.category === group);
      const path = map.route?.path ? decodePolyline(map.route.path) : [];
      const route = map.route ? path.length ? path : points : [];
      const fit = () => {
        const fitPoints = group === "all" ? [...points, ...route] : visible.map(p => points[p.index]);
        if (fitPoints.length) instance.current?.fitBounds(mapBounds(fitPoints), { padding: { top: 70, bottom: 100, left: 90, right: 90 }, maxZoom: 14, duration: reduced() ? 0 : 240 });
      };
      const view = new lib.Map({ container: canvas.current, style: vectorStyle(dark), center: points[0], zoom: 10,
        scrollZoom: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
        cooperativeGestures: true, attributionControl: false });
      instance.current = view;
      view.touchZoomRotate.disableRotation();
      view.addControl(new lib.AttributionControl({ compact: true }), "bottom-left");
      view.addControl(new lib.NavigationControl({ showCompass: false }), "bottom-right");
      const markers = visible.map(({ place, index }) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "hkc-map-pin";
        button.textContent = map.route ? String(index + 1) : "";
        button.setAttribute("aria-label", `${map.route ? `${index + 1}. ` : ""}${place.label}`);
        button.title = place.label; button.dataset.id = place.id;
        button.style.setProperty("--pin-color", map.route ? COLORS[0] : COLORS[Math.max(0, categories.indexOf(place.category)) % COLORS.length]);
        button.addEventListener("click", () => latest.current.onSelect(place.id));
        return new lib.Marker({ element: button }).setLngLat(points[index]).addTo(view);
      });
      // DOM labels share the pins' screen space, so collision includes real pin/control boxes.
      const labels = visible.map(({ place, index }) => {
        const label = document.createElement("span"); label.className = "hkc-map-label";
        label.textContent = `${map.route ? `${index + 1} · ` : ""}${place.label}`;
        label.setAttribute("aria-hidden", "true"); canvas.current!.append(label); return label;
      });
      const syncSelection = () => {
        markers.forEach(marker => marker.getElement().setAttribute("aria-pressed", String(marker.getElement().dataset.id === latest.current.selected)));
        const box = canvas.current!.getBoundingClientRect();
        const obstacles = [...markers.map(m => m.getElement()), ...canvas.current!.querySelectorAll<HTMLElement>(".maplibregl-ctrl"), ...root.current!.querySelectorAll<HTMLElement>("[data-recenter]")].map(el => { const b = el.getBoundingClientRect(); return { left: b.left - box.left - 6, top: b.top - box.top - 6, right: b.right - box.left + 6, bottom: b.bottom - box.top + 6 }; });
        labels.forEach((label, i) => {
          const p = view.project(points[visible[i].index]); label.hidden = false;
          const w = label.offsetWidth, h = label.offsetHeight;
          const candidates = [[p.x-w/2,p.y+24],[p.x-w/2,p.y-24-h],[p.x+24,p.y-h/2],[p.x-24-w,p.y-h/2],[p.x+24,p.y+24],[p.x-w-24,p.y-h-24]];
          const position = candidates.find(([x,y]) => x >= 6 && y >= 6 && x+w <= box.width-6 && y+h <= box.height-6 && !obstacles.some(b => x < b.right && x+w > b.left && y < b.bottom && y+h > b.top));
          label.hidden = !position;
          if (position) { const [x,y] = position; label.style.left = `${x}px`; label.style.top = `${y}px`; obstacles.push({left:x-4,top:y-4,right:x+w+4,bottom:y+h+4}); }
        });
      };
      view.on("render", syncSelection);
      view.on("load", () => {
        if (!active) return;
        if (route.length > 1) {
          const data = (coords: [number, number][]) => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: coords } });
          view.addSource("route", { type: "geojson", data: data(route) });
          view.addLayer({ id: "route-halo", source: "route", type: "line", paint: { "line-color": dark ? "#172320" : "#ffffff", "line-width": 7 } });
          view.addLayer({ id: "route", source: "route", type: "line", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": dark ? "#87ceba" : "#287561", "line-width": 3.5, ...(!path.length ? { "line-dasharray": [2, 2] } : {}) } });
          // A short first draw explains stop order; reduced motion shows the complete path immediately.
          if (!reduced()) {
            const start = performance.now();
            let frame = requestAnimationFrame(function draw(now) {
              if (!active) return;
              const progress = Math.min(1, (now - start) / 240);
              (view.getSource("route") as GeoJSONSource)?.setData(data(route.slice(0, Math.max(2, Math.ceil(route.length * progress)))));
              if (progress < 1) frame = requestAnimationFrame(draw);
            });
            const prior = dispose; dispose = () => { prior(); cancelAnimationFrame(frame); };
          }
        }
        fit(); window.clearTimeout(timer); setState("ready");
      });
      view.on("error", () => { if (active) { window.clearTimeout(timer); setState("failed"); } });
      const resize = new ResizeObserver(() => view.resize()); resize.observe(canvas.current);
      const button = root.current?.querySelector<HTMLButtonElement>("[data-recenter]");
      const recenter = () => { if (button) button.onclick = fit; };
      recenter();
      const prior = dispose; dispose = () => { prior(); resize.disconnect(); if (button) button.onclick = null; labels.forEach(l => l.remove()); markers.forEach(m => m.remove()); view.remove(); instance.current = null; };
    }).catch(() => { if (active) { window.clearTimeout(timer); setState("failed"); } });
    return () => { active = false; window.clearTimeout(timer); dispose(); };
  }, [signature, group, dark, attempt]);
  useEffect(() => { instance.current?.triggerRepaint(); }, [selected]);
  return <div ref={root} className="hkc-map-surface" data-state={state} aria-busy={state === "loading" || undefined}>
    <div ref={canvas} className="hkc-output-map-plane" role="region" aria-label="Interactive map" hidden={state === "failed"} />
    {state === "loading" && <div className="hkc-map-loading" role="status">Loading map…</div>}
    {state === "failed" ? <div className="hkc-map-failure" role="status"><p>Map unavailable. Explore the places in the list below.</p><Button variant="quiet" onClick={() => setAttempt(a => a + 1)}>Try again</Button></div>
      : <Button variant="quiet" className="hkc-map-recenter" data-recenter>Recenter</Button>}
  </div>;
}

export default function InteractiveMap({ map, host }: { map: HarsoOutputMap; host: HarsoOutputMediaHost }) {
  const root = useRef<HTMLElement>(null), dialog = useRef<HTMLDialogElement>(null), expand = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(map.selected_place_id);
  const [group, setGroup] = useState("all"), [expanded, setExpanded] = useState(false), [dark, setDark] = useState(false);
  useEffect(() => { setSelected(map.selected_place_id); setGroup("all"); }, [map]);
  useEffect(() => {
    const provider = root.current?.closest(".harso-kit");
    const update = () => setDark(provider?.getAttribute("data-mode") === "dark"); update();
    const observer = new MutationObserver(update); if (provider) observer.observe(provider, { attributes: true, attributeFilter: ["data-mode"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (expanded) dialog.current?.showModal(); else if (dialog.current?.open) dialog.current.close(); }, [expanded]);
  const categories = [...new Set(map.places.map(p => p.category).filter((c): c is string => !!c))];
  const visible = map.places.slice(0, 12).filter(p => group === "all" || p.category === group);
  const surface = <MapSurface map={map} selected={selected} group={group} onSelect={setSelected} dark={dark} />;
  const route = map.route;
  const street = route?.path && decodePolyline(route.path).length > 1;
  const list = <ul className="hkc-output-map-places" aria-label="Places">{visible.map(place => <li key={place.id}>
    <button type="button" aria-pressed={selected === place.id} onClick={() => setSelected(place.id)}>
      {route && <span className="hkc-map-order">{map.places.indexOf(place) + 1}</span>}
      {place.photo && host.resolveArtifact ? <HarsoOutputThumb photo={place.photo} host={host} /> : <span className="hkc-map-place-icon"><MapPin size={20} aria-hidden="true" /></span>}
      <span><b>{place.label}</b>{place.category && <small>{place.category}</small>}</span>
    </button>
  </li>)}</ul>;
  return <figure ref={root} className="hkc-output-map" aria-label="Map">
    <div className="hkc-map-toolbar">
      {categories.length > 1 ? <select aria-label="Filter places by category" value={group} onChange={e => setGroup(e.target.value)}><option value="all">All places</option>{categories.map(c => <option key={c}>{c}</option>)}</select> : <span>{map.places.length} places</span>}
      <Button ref={expand} variant="quiet" onClick={() => setExpanded(true)}>Expand map</Button>
    </div>
    {!expanded && surface}
    {route && <figcaption className="hkc-map-note">{route.mode === "walk" ? "Walking route" : "Driving route"}{route.minutes !== undefined && ` · ${route.minutes} min`}{route.meters !== undefined && ` · ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(route.meters / 1000)} km`}{!street && <span>Straight lines, not streets</span>}</figcaption>}
    {!expanded && list}
    <dialog ref={dialog} className="hkc-map-dialog" aria-label="Expanded map" onCancel={() => setExpanded(false)} onClose={() => { setExpanded(false); expand.current?.focus(); }}>
      {expanded && <><header><h2>Explore places</h2><Button variant="quiet" onClick={() => setExpanded(false)}>Collapse map</Button></header>{surface}{list}</>}
    </dialog>
  </figure>;
}
