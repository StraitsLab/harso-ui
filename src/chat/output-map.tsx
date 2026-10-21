"use client";

import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import type { GeoJSONSource, Map as LibreMap } from "maplibre-gl";
import { Button } from "../primitives";
import { MapPin, Bank, Storefront, Columns, FlowerLotus } from "@phosphor-icons/react";
import { renderToStaticMarkup } from "react-dom/server";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { HarsoOutputMap, HarsoOutputMediaHost } from "./output-card-media";
import { HarsoOutputThumb } from "./output-card-media";
import { decodePolyline, googleMapsPlaceUrl, mapBounds, mapCoordinates } from "./output-map-utils";
import { watchMapColors, type MapColors } from "./output-map-colors";
import { vectorStyle } from "./output-map-style";
import "maplibre-gl/dist/maplibre-gl.css";
import "./output-map.css";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const GoogleSurface = lazy(() => import("./output-map-google"));

const glyph = (category?: string) => category === "Temple" ? Bank : category === "Shrine" ? FlowerLotus : category === "Market" ? Storefront : category === "Castle" ? Columns : MapPin;

type SurfaceProps = { map: HarsoOutputMap; selected?: string; group: string; onSelect: (id: string) => void; dark: boolean };

function MapSurface({ map, selected, group, onSelect, dark }: SurfaceProps) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null);
  const instance = useRef<LibreMap | null>(null);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [moved, setMoved] = useState(false);
  const recenter = useRef<() => void>(() => {});
  // Start WebGL only near the screen: browsers cap live contexts (~16), and a long chat can hold many map cards.
  const [near, setNear] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (near || !root.current) return;
    const watch = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) setNear(true); }, { rootMargin: "300px" });
    watch.observe(root.current);
    return () => watch.disconnect();
  }, [near]);
  const latest = useRef({ selected, onSelect });
  latest.current = { selected, onSelect };
  const signature = JSON.stringify(map);
  useEffect(() => {
    if (!near) return;
    let active = true, failed = false, loaded = false, basemapReady = false, presented = false, dispose = () => {};
    setState("loading");
    const timer = window.setTimeout(() => { if (active) setState("failed"); }, 15000);
    import("maplibre-gl").then(lib => {
      if (!active || !canvas.current) return;
      lib.setWorkerUrl(workerUrl);
      const points = mapCoordinates(map);
      const visible = map.places.slice(0, 12).map((place, index) => ({ place, index })).filter(({ place }) => group === "all" || place.category === group);
      const path = map.route?.path ? decodePolyline(map.route.path) : [];
      const route = map.route ? path.length ? path : points : [];
      const fit = () => {
        setMoved(false);
        const fitPoints = group === "all" ? [...points, ...route] : visible.map(p => points[p.index]);
        if (fitPoints.length) instance.current?.fitBounds(mapBounds(fitPoints), { padding: { top: 50, bottom: 55, left: 48, right: 48 }, maxZoom: 16, duration: reduced() ? 0 : 240 });
      };
      let colors!: MapColors;
      watchMapColors(root.current!, value => { colors = value; })();
      const view = new lib.Map({ container: canvas.current, style: vectorStyle(colors), center: points[0], zoom: 10,
        scrollZoom: true, dragRotate: false, pitchWithRotate: false, touchPitch: false,
        cooperativeGestures: true, attributionControl: false });
      instance.current = view;
      view.touchZoomRotate.disableRotation();
      view.addControl(new lib.AttributionControl({ compact: true }), "bottom-left");
      const markers = visible.map(({ place, index }) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "hkc-map-pin";
        button.textContent = map.route ? String(index + 1) : "";
        if (!map.route) { const Glyph = glyph(place.category); button.innerHTML = renderToStaticMarkup(<Glyph size={18} weight="bold" aria-hidden="true" />); }
        button.setAttribute("aria-label", `${map.route ? `${index + 1}. ` : ""}${place.label}`);
        button.title = place.label; button.dataset.id = place.id;
        button.addEventListener("click", () => latest.current.onSelect(place.id));
        return new lib.Marker({ element: button }).setLngLat(points[index]).addTo(view);
      });
      const syncSelection = () => markers.forEach(marker => marker.getElement().setAttribute("aria-pressed", String(marker.getElement().dataset.id === latest.current.selected)));
      view.on("render", syncSelection);
      view.on("movestart", event => { if (event.originalEvent) setMoved(true); });
      const ready = () => { if (active && !failed && !presented) {
        presented = true;
        window.clearTimeout(timer); setState("ready");
        if (canvas.current) {
          const attribution = canvas.current.querySelector<HTMLDetailsElement>(".maplibregl-ctrl-attrib");
          attribution?.classList.remove("maplibregl-compact-show"); attribution?.removeAttribute("open");
        }
      } };
      view.once("idle", ready);
      view.on("load", () => {
        if (!active) return;
        loaded = true;
        try {
          if (route.length > 1) {
            const data = (coords: [number, number][]) => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: coords } });
            view.addSource("route", { type: "geojson", data: data(route) });
            view.addLayer({ id: "route-halo", source: "route", type: "line", paint: { "line-color": colors.surface, "line-width": 9 } });
            view.addLayer({ id: "route", source: "route", type: "line", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": colors.accent, "line-width": 5, ...(!path.length ? { "line-dasharray": [2, 2] } : {}) } });
            // Chevrons along the line show the direction, stop 1 towards the last stop. Drawn as an image, so they need no
            // glyph download.
            const size = 24, chevron = new ImageData(size, size);
            // SDF mask only; the live surface token supplies the visible arrow colour.
            for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
              const d = Math.abs(y - size / 2), on = Math.abs((x - 7) - (size / 2 - d) * 0.6) < 2.4 && d < 7;
              if (on) chevron.data.set([255, 255, 255, 255], (y * size + x) * 4);
            }
            if (!view.hasImage("route-chevron")) view.addImage("route-chevron", chevron, { pixelRatio: 1.5, sdf: true });
            view.addLayer({ id: "route-direction", source: "route", type: "symbol", layout: { "symbol-placement": "line", "symbol-spacing": 70,
              "icon-image": "route-chevron", "icon-rotation-alignment": "map", "icon-allow-overlap": true, "icon-ignore-placement": true }, paint: { "icon-color": colors.surface } });
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
        } catch (error) {
          console.warn("Map route decoration unavailable", error);
        } finally {
          fit(); ready();
        }
      });
      view.on("sourcedata", event => { if (event.sourceId === "places" && event.sourceDataType === "metadata") basemapReady = true; });
      view.on("error", (errorEvent) => {
        const event = errorEvent as typeof errorEvent & { tile?: unknown; sourceId?: string };
        // A failed TileJSON can be reported after load: only metadata proves the basemap started successfully.
        if (!active || event.tile || (loaded && (event.sourceId !== "places" || basemapReady))) return;
        failed = true;
        window.clearTimeout(timer); setState("failed");
      });
      const resize = new ResizeObserver(() => view.resize()); resize.observe(canvas.current);
      recenter.current = fit;
      const stopColors = watchMapColors(root.current!, value => {
        colors = value;
        if (!loaded) return;
        for (const layer of vectorStyle(colors).layers) {
          if (view.getLayer(layer.id) && "paint" in layer) for (const [name, color] of Object.entries(layer.paint ?? {})) view.setPaintProperty(layer.id, name as Parameters<LibreMap["setPaintProperty"]>[1], color);
        }
        if (view.getLayer("route")) view.setPaintProperty("route", "line-color", colors.accent);
        if (view.getLayer("route-halo")) view.setPaintProperty("route-halo", "line-color", colors.surface);
        if (view.getLayer("route-direction")) view.setPaintProperty("route-direction", "icon-color", colors.surface);
      });
      const prior = dispose; dispose = () => { prior(); stopColors(); resize.disconnect(); markers.forEach(m => m.remove()); view.remove(); instance.current = null; };

    }).catch(() => { if (active) { window.clearTimeout(timer); setState("failed"); } });
    return () => { active = false; window.clearTimeout(timer); dispose(); };
  }, [signature, group, dark, attempt, near]);
  useEffect(() => { instance.current?.triggerRepaint(); }, [selected]);
  return <div ref={root} className="hkc-map-surface" data-state={state} aria-busy={state === "loading" || undefined}>
    <div ref={canvas} className="hkc-output-map-plane" role="region" aria-label="Interactive map" hidden={state === "failed"} />
    {state === "loading" && <div className="hkc-map-loading" role="status">Loading map…</div>}
    {state === "failed" ? <div className="hkc-map-failure" role="status"><p>Map unavailable. Explore the places in the list below.</p><Button variant="quiet" onClick={() => setAttempt(a => a + 1)}>Try again</Button></div>
      : moved && <Button variant="quiet" className="hkc-map-recenter" data-recenter onClick={() => recenter.current()}>Recenter</Button>}
  </div>;
}

/** `listed`: the card already lists these places in its own rows, so the map shows no second list inline. */
export default function InteractiveMap({ map, host, listed = false, onOpenUrl, selected: controlled, onSelect }: { map: HarsoOutputMap; host: HarsoOutputMediaHost; listed?: boolean; onOpenUrl?: (url: string) => void; selected?: string; onSelect?: (id: string) => void }) {
  const root = useRef<HTMLElement>(null), dialog = useRef<HTMLDialogElement>(null), expand = useRef<HTMLButtonElement>(null);
  const [localSelected, setSelected] = useState(map.selected_place_id);
  const selected = onSelect ? controlled : localSelected;
  const select = onSelect ?? setSelected;
  const inlineSurface = useRef<HTMLDivElement>(null), dialogSurface = useRef<HTMLDivElement>(null);
  const [surfaceNode, setSurfaceNode] = useState<HTMLDivElement | null>(null);
  const [group, setGroup] = useState("all"), [expanded, setExpanded] = useState(false), [dark, setDark] = useState(false);
  useEffect(() => { setSelected(map.selected_place_id); setGroup("all"); }, [map]);
  useEffect(() => root.current ? watchMapColors(root.current, () => {}) : undefined, []);
  useEffect(() => {
    const provider = root.current?.closest(".harso-kit");
    const update = () => setDark(provider?.getAttribute("data-mode") === "dark"); update();
    const observer = new MutationObserver(update); if (provider) observer.observe(provider, { attributes: true, attributeFilter: ["data-mode"] });
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!surfaceNode) { setSurfaceNode(document.createElement("div")); return; }
    // Move one portal target, not the React surface: expansion must not bill another Google map.
    (expanded ? dialogSurface.current : inlineSurface.current)?.append(surfaceNode);
    if (expanded) dialog.current?.showModal(); else if (dialog.current?.open) dialog.current.close();
  }, [expanded, surfaceNode]);
  const categories = [...new Set(map.places.map(p => p.category).filter((c): c is string => !!c))];
  const visible = map.places.slice(0, 12).filter(p => group === "all" || p.category === group);
  const surface = host.googleMaps
    ? <Suspense fallback={<div className="hkc-map-surface" data-state="loading"><div className="hkc-map-loading" role="status">Loading map…</div></div>}>
        <GoogleSurface map={map} selected={selected} group={group} onSelect={select} dark={dark} google={host.googleMaps} expanded={expanded} glyph={glyph} />
      </Suspense>
    : <MapSurface map={map} selected={selected} group={group} onSelect={select} dark={dark} />;
  const route = map.route;
  const street = route?.path && decodePolyline(route.path).length > 1;
  const selectedPlace = visible.find(place => place.id === selected);
  const openSelected = host.googleMaps && onOpenUrl && selectedPlace
    ? <Button variant="quiet" onClick={() => onOpenUrl(googleMapsPlaceUrl(selectedPlace))}>Open in Google Maps</Button> : null;
  const List = route ? "ol" : "ul";
  const list = <List className="hkc-output-map-places" data-route={route ? "" : undefined} aria-label="Places">{visible.map(place => <li key={place.id}>
    <button type="button" aria-pressed={selected === place.id} onClick={() => select(place.id)}>
      <span className="hkc-map-order">{route ? map.places.indexOf(place) + 1 : (() => { const Glyph = glyph(place.category); return <Glyph size={16} aria-hidden="true" />; })()}</span>
      {place.photo && host.resolveArtifact ? <HarsoOutputThumb photo={place.photo} host={host} /> : null}
      <span><b>{place.label}</b>{place.category && <small>{place.category}</small>}</span>
    </button>
  </li>)}</List>;
  return <figure ref={root} className="hkc-output-map" aria-label="Map">
    <div className="hkc-map-toolbar">
      {categories.length > 1 ? <select aria-label="Filter places by category" value={group} onChange={e => setGroup(e.target.value)}><option value="all">All places</option>{categories.map(c => <option key={c}>{c}</option>)}</select> : <span>{map.places.length} places</span>}
      <Button ref={expand} variant="quiet" onClick={() => setExpanded(true)}>Expand map</Button>
    </div>
    <div ref={inlineSurface} hidden={expanded} />
    {surfaceNode && createPortal(surface, surfaceNode)}
    <figcaption className="hkc-map-note">{selectedPlace && <strong>{selectedPlace.label}</strong>}
    {route && <span>{route.mode === "walk" ? "Walking route" : "Driving route"}{route.minutes !== undefined && ` · ${route.minutes} min`}{route.meters !== undefined && ` · ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(route.meters / 1000)} km`}{!street && <span>Straight lines, not streets</span>}</span>}</figcaption>
    {!expanded && openSelected}
    {!expanded && !listed && list}
    <dialog ref={dialog} className="hkc-map-dialog" aria-label="Expanded map" onCancel={() => setExpanded(false)} onClose={() => { setExpanded(false); expand.current?.focus(); }}>
      <header><h2>Explore places</h2><Button variant="quiet" onClick={() => setExpanded(false)}>Collapse map</Button></header>
      <div ref={dialogSurface} />
      {expanded && <>{openSelected}{list}</>}
    </dialog>
  </figure>;
}
