import { AxiosError } from 'axios';
import { MainNode } from '../../views/product/lib/Logic';
import axiosInstance, { baseUrl } from './axiosInstance';

// Match the inline-shape returned by API/ProductController.php
export type ProductListItem = {
  id: string;
  name: string;
  sub?: string | null;
  manufacturer: string | null;
  category: string;
  image: string | null;
};

// One numeric measurement on a size option. Mirrors the backend's
// normalizeSizes() output — `displayRange` is the raw cell text the
// admin (or markdown parser) saved, preserved for display.
export type ProductDetailMeasurement = {
  min: number;
  max: number;
  displayRange?: string;
};

// One size option, e.g. "Taille 1". Measurements is keyed by dimensionKey
// (e.g. "tour_de_cheville") and matches the rules.json tree.
export type ProductDetailSizeOption = {
  label: string;
  displayRange?: string;
  measurements: Record<string, ProductDetailMeasurement>;
};

export type ProductDetailSizes = {
  options: ProductDetailSizeOption[];
};

export type ProductDetail = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
  images: string[];
  tags: string[];
  description_tabs: { title: string; content_markdown: string }[];
  sizes?: ProductDetailSizes | null;
  sub?: string | null;
  // Protocol group ids this product is tagged with. Used for context
  // ("this product belongs to: Lombalgie aiguë / Phase 1 / Contention
  // rigide") — not for filtering, since the API already did that.
  groups?: string[];
};

// ============================================================
// Protocol types — match protocols.json shape from the backend.
// ============================================================

// A single group inside a phase. Two flavours:
//   - "filter": tappable, links to a filtered product list
//   - "info":   tappable, opens a modal with markdown content
export type ProtocolGroup =
  | {
      id: string;
      type: 'filter';
      label: string;
      image?: string;
    }
  | {
      id: string;
      type: 'info';
      label: string;
      image?: string;
      content?: string;
    };

export type ProtocolPhase = {
  id: string;
  title: string;
  groups: ProtocolGroup[];
};

export type Protocol = {
  id: string;
  title: string;
  phases: ProtocolPhase[];
};

// ============================================================
// Query string builders
// ============================================================

// Filters come in as a flat list of childIds. URLSearchParams.toString()
// joins arrays with commas, which the backend's parseFilterParam handles
// via explode(','). Empty filters → omit the param entirely. Optional
// groupId is appended as `&group=...` when set (backend reads it via
// parseGroupParam in Api/ProductController).
function buildFilterQuery(filters: string[], groupId?: string | null): string {
  const parts: Record<string, string> = {};
  if (filters && filters.length > 0) parts.filters = filters.join(',');
  if (groupId)                        parts.group   = groupId;
  if (Object.keys(parts).length === 0) return '';
  return `?${new URLSearchParams(parts).toString()}`;
}

// ============================================================
// API calls
// ============================================================

export const filterProducts = async (
  filters: string[],
  groupId?: string | null,
): Promise<ProductListItem[]> => {
  return axiosInstance
    .get(`${baseUrl}/products${buildFilterQuery(filters, groupId)}`)
    .then((response) => response.data?.data ?? [])
    .catch((e: AxiosError) => {
      console.warn('filterProducts failed', e.message);
      return [];
    });
};

export const countFilteredProducts = async (
  filters: string[],
  groupId?: string | null,
): Promise<number> => {
  return axiosInstance
    .get(`${baseUrl}/products/count${buildFilterQuery(filters, groupId)}`)
    .then((response) => response.data?.count ?? 0)
    .catch((e: AxiosError) => {
      console.warn('countFilteredProducts failed', e.message);
      return 0;
    });
};

export const getProduct = async (
  productId: string | number,
): Promise<ProductDetail | null> => {
  return axiosInstance
    .get(`${baseUrl}/products/${productId}`)
    .then((response) => {
      return response.data?.data ?? null
    })
    .catch((e: AxiosError) => {
      console.warn('getProduct failed', e.message);
      return null;
    });
};

// Fetch the rules tree (formerly imported as SAMPLE_NODES). Callers
// typically wrap this in useQuery({ queryKey: ['product-rules'], ... })
// so the result is shared across screens via React Query's cache.
export const getRules = async (): Promise<MainNode[]> => {
  return axiosInstance
    .get(`${baseUrl}/rules/products`)
    .then((response) => Array.isArray(response.data) ? response.data : [])
    .catch((e: AxiosError) => {
      console.warn('getRules failed', e.message);
      return [];
    });
};

// Fetch the protocol definitions (treatment plans + phases + groups).
// Mirror the same caching pattern as getRules — wrap callers in
// useQuery({ queryKey: ['product-protocols'], ... }) so multiple
// screens share the result without refetching.
//
// URL pattern mirrors getRules (`/rules/products` → `/protocols/products`).
// If the backend route is registered differently (e.g. nested under
// /products/protocols), adjust this line.
export const getProtocols = async (): Promise<Protocol[]> => {
  return axiosInstance
    .get(`${baseUrl}/protocols/products`)
    .then((response) => Array.isArray(response.data) ? response.data : [])
    .catch((e: AxiosError) => {
      console.warn('getProtocols failed', e.message);
      return [];
    });
};

// Fetch product counts per group id, given a filter set. ProtocolScreen
// uses this to disable groups that would lead to an empty list — saves
// the user a tap-then-bounce-back round trip.
//
// Returns a map { groupId: count }. Missing keys are treated as count 0
// (the backend always returns every requested groupId, but we're
// defensive). Empty input → empty map, no network call.
//
// URL pattern: nested under /products. Adjust if backend uses a
// different route.
export const getGroupCounts = async (
  filters: string[],
  groupIds: string[],
): Promise<Record<string, number>> => {
  if (groupIds.length === 0) return {};

  const parts: Record<string, string> = {};
  if (filters.length > 0) parts.filters = filters.join(',');
  parts.groups = groupIds.join(',');
  const query = `?${new URLSearchParams(parts).toString()}`;

  return axiosInstance
    .get(`${baseUrl}/products/counts-by-group${query}`)
    .then((response) => (response.data && typeof response.data === 'object') ? response.data : {})
    .catch((e: AxiosError) => {
      console.warn('getGroupCounts failed', e.message);
      return {};
    });
};