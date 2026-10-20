import type { StyleSpecification } from "maplibre-gl";
import type { MapColors } from "./output-map-colors";

/** Quiet kit cartography over public OpenMapTiles geometry. */
export function vectorStyle(c: MapColors): StyleSpecification {
 return {
 version: 8,
 glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
 sources: { places: { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: ' OpenFreeMap © OpenMapTiles · Data from OpenStreetMap ' } },
 layers: [
 { id: "background", type: "background", paint: { "background-color": c.canvas } },
 { id: "landcover", type: "fill", source: "places", "source-layer": "landcover", filter: ["in", "class", "wood", "grass"], paint: { "fill-color": c.line, "fill-opacity": 0.25 } },
 { id: "parks", type: "fill", source: "places", "source-layer": "park", paint: { "fill-color": c.line, "fill-opacity": 0.35 } },
 { id: "school", type: "fill", source: "places", "source-layer": "landuse", filter: ["in", "class", "school", "university", "hospital"], paint: { "fill-color": c.canvas } },
 { id: "water", type: "fill", source: "places", "source-layer": "water", paint: { "fill-color": c.soft } },
 { id: "waterways", type: "line", source: "places", "source-layer": "waterway", paint: { "line-color": c.soft, "line-width": 1 } },
 { id: "buildings", type: "fill", minzoom: 14, source: "places", "source-layer": "building", paint: { "fill-color": c.line, "fill-opacity": 0.35 } },
 { id: "streets", type: "line", source: "places", "source-layer": "transportation", filter: ["!in", "class", "rail", "transit", "ferry", "motorway", "trunk", "primary"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": c.surface, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 12, 1.5, 14, 2.8, 17, 8] } },
 { id: "main-roads", type: "line", source: "places", "source-layer": "transportation", filter: ["in", "class", "motorway", "trunk", "primary"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": c.surface, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.7, 12, 3, 14, 5, 17, 12] } },
 { id: "ferries", type: "line", source: "places", "source-layer": "transportation", filter: ["==", "class", "ferry"], paint: { "line-color": c.line, "line-width": 0.8 } },
 { id: "neighborhood-labels", type: "symbol", source: "places", "source-layer": "place", minzoom: 10, maxzoom: 15, filter: ["in", "class", "suburb", "quarter", "neighbourhood"], layout: { "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]], "text-font": ["Noto Sans Regular"], "text-size": 10, "text-letter-spacing": 0.08, "text-transform": "uppercase", "text-max-width": 8 }, paint: { "text-color": c.ink, "text-halo-color": c.canvas, "text-halo-width": 1.2 } },
 { id: "city-labels", type: "symbol", source: "places", "source-layer": "place", minzoom: 7, maxzoom: 13, filter: ["in", "class", "city", "town"], layout: { "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]], "text-font": ["Noto Sans Regular"], "text-size": 14, "text-max-width": 8 }, paint: { "text-color": c.ink, "text-halo-color": c.canvas, "text-halo-width": 1.5 } },
 ],
 };
}

