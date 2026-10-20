// Vite emits MapLibre's ESM worker and its shared module together.
declare module "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url" {
  const url: string;
  export default url;
}
