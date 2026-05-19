// ============================================================
// Product domain types + mock data + matcher.
// In production, swap mockProducts with an API call. The matcher
// signature stays the same.
// ============================================================

import { Selections } from './Logic';

// One size entry. filter_key references a childId in rules.json under
// a "mesure_*" node — used by ProductDetailModal to highlight the
// matching row when the user has that filter selected.
export type ProductSize = {
  label: string;             // "S", "M", "1", "2" — admin-defined
  range?: string | null;     // "14-16 cm" — display only, optional
  filter_key?: string | null; // childId like "poignet-m", optional
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
  sizes?: ProductSize[];
};

// Flatten selections into a Set of all selected childIds for fast lookup.
function flattenSelections(selections: Selections): Set<string> {
  const out = new Set<string>();
  for (const arr of Object.values(selections)) {
    for (const v of arr) out.add(v);
  }
  return out;
}

// Match a product against current pathology filters.
// Rule: a product matches if ANY of its tags are in the selection set.
// If selections are empty, return all products.
//
// Replace this with your real matching logic — typed constraints,
// pregnancy exclusions, age ranges, etc.
export function matchProducts(
  products: Product[],
  selections: Selections,
): Product[] {
  const tags = flattenSelections(selections);
  if (tags.size === 0) return products;
  return products.filter(p => p.tags.some(t => tags.has(t)));
}