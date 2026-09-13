export function sampleImage(index: number, aspect = "Landscape") {
  const height = aspect === "Portrait" ? 780 : aspect === "Square" ? 600 : 400;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}"><rect width="600" height="${height}" fill="${index % 2 ? "#ded9cc" : "#dbe4df"}"/><circle cx="430" cy="110" r="65" fill="#faf6e9"/><path d="M0 ${height * .65} Q160 ${height * .3} 300 ${height * .65} T600 ${height * .5} V${height} H0Z" fill="${index % 2 ? "#9a8c7d" : "#748b83"}"/><path d="M0 ${height * .9} Q230 ${height * .55} 600 ${height * .9} V${height} H0Z" fill="${index % 2 ? "#655c55" : "#415b54"}"/></svg>`)}`;
}
