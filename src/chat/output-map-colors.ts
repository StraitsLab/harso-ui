export type MapColors = { ink: string; accent: string; surface: string; canvas: string; line: string; soft: string };

/** Read the live kit, not token defaults: tint/palette overrides belong to the host. */
export function watchMapColors(element: HTMLElement, update: (colors: MapColors) => void) {
  const kit = element.closest<HTMLElement>(".harso-kit") ?? element;
  const read = () => {
    const css = getComputedStyle(kit);
    const token = (name: string) => css.getPropertyValue(`--hk-${name}`).trim();
    const probe = document.createElement("span"); kit.append(probe);
    const resolve = (value: string) => { probe.style.color = value; return getComputedStyle(probe).color; };
    const graphite = !!token("accent") && resolve(token("accent")) === resolve(token("ink"));
    probe.remove();
    const fill = graphite ? "var(--hk-secondary)" : "var(--hk-ink)";
    if (element.style.getPropertyValue("--hkc-map-unselected") !== fill) element.style.setProperty("--hkc-map-unselected", fill);
    update({ ink: token("ink"), accent: token("accent"), surface: token("surface"), canvas: token("canvas"), line: token("line"), soft: token("accent-soft") });
  };
  read();
  const observer = new MutationObserver(read);
  // Tints can be set on the kit or inherited from a host's class/data/style attributes.
  for (let node: HTMLElement | null = kit; node; node = node.parentElement) observer.observe(node, { attributes: true });
  return () => observer.disconnect();
}
