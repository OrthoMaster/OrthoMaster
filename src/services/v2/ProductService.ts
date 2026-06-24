import { AxiosError } from 'axios';
import { MainNode } from '../../views/product/lib/Logic';
import axiosInstance, { baseUrl } from './axiosInstance';

// Match the inline-shape returned by API/ProductController.php
export type ProductListItem = {
  id: string;
  name: string;
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
};

// Filters come in as a flat list of childIds. URLSearchParams.toString()
// joins arrays with commas, which the backend's parseFilterParam handles
// via explode(','). Empty filters → omit the param entirely.
function buildFilterQuery(filters: string[]): string {
  if (!filters || filters.length === 0) return '';
  const params = new URLSearchParams({ filters: filters.join(',') });
  return `?${params.toString()}`;
}

export const filterProducts = async (
  filters: string[],
): Promise<ProductListItem[]> => {
  return axiosInstance
    .get(`${baseUrl}/products${buildFilterQuery(filters)}`)
    .then((response) => response.data?.data ?? [])
    .catch((e: AxiosError) => {
      console.warn('filterProducts failed', e.message);
      return [];
    });
};

export const countFilteredProducts = async (
  filters: string[],
): Promise<number> => {
  return axiosInstance
    .get(`${baseUrl}/products/count${buildFilterQuery(filters)}`)
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