// ============================================================
// Product domain types + mock data + matcher.
// In production, swap mockProducts with an API call. The matcher
// signature stays the same.
// ============================================================

import { Selections } from './Logic';

export type Product = {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  // Multiple product images for the detail carousel
  images: string[];           // remote URLs or local require()
  // Tags this product is suitable for — matched against selections
  // by simple intersection. Replace with your real matching rules.
  tags: string[];
  description?: string;
};

// Lightweight placeholder images (Lorem Picsum is reliable for demos).
// Use stable seeds so the same product always shows the same image.
const img = (seed: string, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Genouillère ligamentaire Genu Pro',
    manufacturer: 'Thuasne',
    category: 'Orthèse de genou',
    images: [img('genu-1'), img('genu-2'), img('genu-3'), img('genu-4')],
    tags: ['mem-inf-gen', 'gen-ant', 'gen-med', 'gen-lat', 'rhumato', 'traumato'],
  },
  {
    id: 'p2',
    name: 'Ceinture lombaire Lombax Dual',
    manufacturer: 'Thuasne',
    category: 'Ceinture lombaire',
    images: [img('lomb-1'), img('lomb-2'), img('lomb-3')],
    tags: ['tronc-rac-bas', 'rach-bas-lomb', 'rach-bas-glob', 'rhumato'],
  },
  {
    id: 'p3',
    name: 'Attelle de poignet Manu RhizoLight',
    manufacturer: 'Donjoy',
    category: 'Orthèse de poignet',
    images: [img('manu-1'), img('manu-2')],
    tags: ['mem-sup-poi', 'poi-poi', 'poi-bas', 'rhumato', 'traumato'],
  },
  {
    id: 'p4',
    name: 'Chevillière Achimed Activ',
    manufacturer: 'Gibaud',
    category: 'Chevillière',
    images: [img('chev-1'), img('chev-2'), img('chev-3'), img('chev-4'), img('chev-5')],
    tags: ['mem-inf-che', 'che-lat', 'che-med', 'che-glob', 'traumato'],
  },
  {
    id: 'p5',
    name: 'Collier cervical Ortel C1',
    manufacturer: 'Thuasne',
    category: 'Collier cervical',
    images: [img('cerv-1'), img('cerv-2')],
    tags: ['rach-hau-cerv', 'cer-trau-tor', 'cer-rhu-tor', 'rhumato', 'traumato'],
  },
  {
    id: 'p6',
    name: 'Coudière épicondylite Epi-Med',
    manufacturer: 'Donjoy',
    category: 'Coudière',
    images: [img('coude-1'), img('coude-2'), img('coude-3')],
    tags: ['mem-sup-cou', 'cou-epi', 'rhumato'],
  },
  {
    id: 'p7',
    name: 'Genouillère rotulienne Patella Stab',
    manufacturer: 'Gibaud',
    category: 'Orthèse de genou',
    images: [img('rot-1'), img('rot-2')],
    tags: ['mem-inf-gen', 'gen-ant', 'rhumato'],
  },
  {
    id: 'p8',
    name: 'Attelle d\'épaule Immo Confort',
    manufacturer: 'Thuasne',
    category: 'Orthèse d\'épaule',
    images: [img('epa-1'), img('epa-2'), img('epa-3'), img('epa-4')],
    tags: ['mem-sup-epa', 'epa-cla', 'epa-epa', 'traumato'],
  },
  {
    id: 'p9',
    name: 'Ceinture de maintien abdominal',
    manufacturer: 'Donjoy',
    category: 'Ceinture abdominale',
    images: [img('abd-1'), img('abd-2'), img('abd-3')],
    tags: ['tronc-abd', 'abd-abd', 'abd-mat'],
  },
  {
    id: 'p10',
    name: 'Semelle orthopédique Active Sport',
    manufacturer: 'Sidas',
    category: 'Semelle orthopédique',
    images: [img('sem-1'), img('sem-2'), img('sem-3'), img('sem-4'), img('sem-5'), img('sem-6')],
    tags: ['mem-inf-pie', 'pie-arr', 'pie-med', 'activ-3', 'activ-4'],
  },
  {
    id: 'p11',
    name: 'Bandage thumb Rhizo-Soft',
    manufacturer: 'Gibaud',
    category: 'Orthèse pouce',
    images: [img('pouce-1'), img('pouce-2')],
    tags: ['mem-sup-doi', 'doi-pou', 'rhumato'],
  },
  {
    id: 'p12',
    name: 'Genouillère ouverte Strapping Plus',
    manufacturer: 'Thuasne',
    category: 'Orthèse de genou',
    images: [img('strap-1'), img('strap-2'), img('strap-3')],
    tags: ['mem-inf-gen', 'gen-ant', 'gen-pos', 'traumato'],
  },
];

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