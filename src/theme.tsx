import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createContext, useSyncExternalStore, type HTMLAttributes } from "react";

// Internal marker: standalone tooltips install a fallback only outside KitProvider.
export const KitTooltipContext = createContext(false);

export type Appearance = "system" | "light" | "dark";
export type Palette = "clean" | "cozy";

function subscribeToAppearance(notify: () => void) {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function systemIsDark() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function KitProvider({ appearance = "system", palette = "clean", className = "", delayDuration = 400, skipDelayDuration = 300, ...props }: HTMLAttributes<HTMLDivElement> & { appearance?: Appearance; palette?: Palette; delayDuration?: number; skipDelayDuration?: number }) {
  const dark = useSyncExternalStore(subscribeToAppearance, systemIsDark, () => false);
  return <KitTooltipContext.Provider value={true}><TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}><div {...props} className={`harso-kit ${className}`} data-appearance={appearance} data-mode={appearance === "system" ? dark ? "dark" : "light" : appearance} data-palette={palette} /></TooltipPrimitive.Provider></KitTooltipContext.Provider>;
}
