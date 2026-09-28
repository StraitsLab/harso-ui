export function sampleImage(index: number, aspect = "Landscape") {
  const height = aspect === "Portrait" ? 780 : aspect === "Square" ? 600 : 400;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}"><rect width="600" height="${height}" fill="${index % 2 ? "#ded9cc" : "#dbe4df"}"/><circle cx="430" cy="110" r="65" fill="#faf6e9"/><path d="M0 ${height * .65} Q160 ${height * .3} 300 ${height * .65} T600 ${height * .5} V${height} H0Z" fill="${index % 2 ? "#9a8c7d" : "#748b83"}"/><path d="M0 ${height * .9} Q230 ${height * .55} 600 ${height * .9} V${height} H0Z" fill="${index % 2 ? "#655c55" : "#415b54"}"/></svg>`)}`;
}

/** Sky, far hill, near ground: muted photo-like palettes (fixture art, not app colour). */
const SCENES = [
  ["#dbe4df", "#748b83", "#415b54"], ["#ded9cc", "#9a8c7d", "#655c55"], ["#e3dde6", "#8f8199", "#5a4c63"],
  ["#dde3ea", "#7d8fa3", "#48596d"], ["#eadfd4", "#b08d6e", "#72563f"], ["#e2e6d6", "#8e9a6c", "#58633d"]
];

/**
 * A local, deterministic sample photo for any artifact id (same id → same picture, no network), so catalogue rows
 * and galleries show distinct photos. Varies palette, sun and horizon by a hash of the id.
 */
export function sampleArtifact(artifact: string) {
  let hash = 2166136261;
  for (const char of artifact) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const [sky, far, near] = SCENES[hash % SCENES.length];
  const sun = 120 + (hash >>> 3) % 360, horizon = 0.45 + ((hash >>> 9) % 20) / 100;
  const h = 600;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${h}" viewBox="0 0 600 ${h}"><rect width="600" height="${h}" fill="${sky}"/><circle cx="${sun}" cy="${h * .22}" r="54" fill="#faf6e9"/><path d="M0 ${h * horizon} Q160 ${h * (horizon - .25)} 300 ${h * horizon} T600 ${h * (horizon - .1)} V${h} H0Z" fill="${far}"/><path d="M0 ${h * .9} Q230 ${h * .6} 600 ${h * .88} V${h} H0Z" fill="${near}"/></svg>`)}`;
}

const svg = (body: string, size = 256) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`)}`;
/** A local map tile: a street grid that continues across tile edges, a park on some tiles (offline, deterministic). */
export function sampleTile(z: number, x: number, y: number) {
  const park = (x * 7 + y * 3 + z) % 4 === 0;
  return svg(`<rect width="256" height="256" fill="#ecebe6"/>${park ? `<rect x="150" y="30" width="80" height="56" rx="6" fill="#dde5d6"/>` : ""}`
    + `<path d="M0 96H256M0 208H256M72 0V256M184 0V256" stroke="#ffffff" stroke-width="6"/><path d="M0 150H256" stroke="#d3dde3" stroke-width="10"/>`);
}
