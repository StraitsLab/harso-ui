import { useSyncExternalStore, type HTMLAttributes } from "react";

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

export function KitProvider({ appearance = "system", palette = "clean", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { appearance?: Appearance; palette?: Palette }) {
  const dark = useSyncExternalStore(subscribeToAppearance, systemIsDark, () => false);
  return <div {...props} className={`harso-kit ${className}`} data-appearance={appearance} data-mode={appearance === "system" ? dark ? "dark" : "light" : appearance} data-palette={palette} />;
}
