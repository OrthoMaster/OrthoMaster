// ============================================================
// Product domain types.
// Sizes follow the NEW flat schema:
//   { options: [{ label, displayRange, measurements: {dimKey: {min,max,displayRange}} }] }
// ============================================================

import { Selections } from './Logic';

// One numeric measurement on a size option.
export type ProductMeasurement = {
  min: number;
  max: number;
  displayRange?: string;     // raw cell text, e.g. "19 cm - 21 cm"
};

// One size option (e.g. "Taille 1") with per-dimension measurements
// keyed by dimensionKey (e.g. "tour_de_cheville").
export type ProductSizeOption = {
  label: string;
  displayRange?: string;     // compact summary, e.g. "19-21 cm" or "19-21 / 30-34 cm"
  measurements: Record<string, ProductMeasurement>;
};

export type ProductSizes = {
  options: ProductSizeOption[];
};

export type Product = {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  images: string[];
  tags: string[];
  description?: string;
  description_tabs?: { title: string; content_markdown: string }[];
  sizes?: ProductSizes | null;
  sub?: string | null;
};

// Flatten selections into a Set of all selected childIds for fast lookup.
function flattenSelections(selections: Selections): Set<string> {
  const out = new Set<string>();
  for (const arr of Object.values(selections)) {
    for (const v of arr) out.add(v);
  }
  return out;
}

// Local fallback matcher (still tag-set intersection). The real filter
// runs server-side now via /api/products?filters[]=. This helper exists
// for tests or in-memory scenarios; production code calls the API.
export function matchProducts(
  products: Product[],
  selections: Selections,
): Product[] {
  const tags = flattenSelections(selections);
  if (tags.size === 0) return products;
  return products.filter(p => p.tags.some(t => tags.has(t)));
}