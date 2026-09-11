import inventory from "./catalog.json";

export type ReferenceVendor = "boardui" | "vercel";
export type ReferencePart = { name: string; harsoExport: string };
export type ReferenceComponent = {
  id: string;
  vendor: ReferenceVendor;
  slug: string;
  name: string;
  category: string;
  description: string;
  url: string;
  access: string;
  harsoExport: string;
  parts: ReferencePart[];
  helperApis?: string[];
  variants: string[];
  evidence: string;
};

export const referenceComponents = inventory.components as ReferenceComponent[];
export const referenceSources = inventory.sources;
export const referenceAccounting = inventory.accounting;

export type CatalogueFilter = { query?: string; vendor?: ReferenceVendor | "all"; category?: string };

export function filterReferences({ query = "", vendor = "all", category = "all" }: CatalogueFilter = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return referenceComponents.filter(component => {
    const text = [component.name, component.slug, component.harsoExport, component.category, component.description, ...component.parts.flatMap(part => [part.name, part.harsoExport]), ...component.helperApis ?? []].join(" ").toLocaleLowerCase();
    return (vendor === "all" || component.vendor === vendor) && (category === "all" || component.category === category) && terms.every(term => text.includes(term));
  });
}
