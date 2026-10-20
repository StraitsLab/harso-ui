import type { LngLatBoundsLike } from "maplibre-gl";
import type { HarsoOutputMap, HarsoOutputPlace } from "./output-card-media";

/** Google Maps URLs use the persistent place identity when supplied, otherwise the exact coordinates. */
export function googleMapsPlaceUrl(place: HarsoOutputPlace): string {
  const query = place.place_id ? `${encodeURIComponent(place.label)}&query_place_id=${encodeURIComponent(place.place_id)}` : `${place.lat},${place.lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Google encoded polyline, precision 5. Reject malformed input rather than drawing a misleading route. */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded || encoded.length > 3000 || !/^[?-~]+$/.test(encoded)) return [];
  let index = 0, lat = 0, lon = 0;
  const points: [number, number][] = [];
  const read = () => {
    let value = 0, shift = 0, byte: number;
    do {
      if (index >= encoded.length || shift > 30) throw new Error("Invalid polyline");
      byte = encoded.charCodeAt(index++) - 63;
      value |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return value & 1 ? ~(value >>> 1) : value >>> 1;
  };
  try {
    while (index < encoded.length) {
      lat += read(); lon += read();
      if (Math.abs(lat) > 9000000 || Math.abs(lon) > 18000000) return [];
      points.push([lon / 100000, lat / 100000]);
    }
  } catch { return []; }
  return points.length > 1 ? points : [];
}

/** Use the shortest longitude span, including destinations on either side of the dateline. */
export function mapCoordinates(map: HarsoOutputMap): [number, number][] {
  const points = map.places.slice(0, 12).map(p => [Number(p.lon), Number(p.lat)] as [number, number]);
  const sorted = points.map(p => p[0]).sort((a, b) => a - b);
  let gap = sorted[0] + 360 - sorted[sorted.length - 1], cut: number | undefined;
  for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] > gap) { gap = sorted[i] - sorted[i - 1]; cut = sorted[i]; }
  return points.map(([lon, lat]) => [cut !== undefined && lon < cut ? lon + 360 : lon, lat]);
}

export function mapBounds(points: [number, number][]): LngLatBoundsLike {
  return [[Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1]))], [Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))]];
}
