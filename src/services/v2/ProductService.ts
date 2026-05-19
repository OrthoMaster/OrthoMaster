import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

// Match the inline-shape returned by API/ProductController.php
export type ProductListItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
  image: string | null;
};

// Size structures mirror the JSON column on the backend.
//
// One product has up to N "dimensions" (Tour de taille, Hauteur, ...).
// Each dimension has options (S/M/L or 1/2/3). Each option either has
// a flat filter_keys array (simple AND match) OR variants (an OR of
// conditional AND-groups, e.g. "Nam+32-36 OR Nữ+20").
export type ProductDetailSizeVariant = {
  filter_keys: string[];
  range?: string;
};
export type ProductDetailSizeOption = {
  label: string;
  range?: string;
  filter_keys?: string[];
  variants?: ProductDetailSizeVariant[];
};
export type ProductDetailSizeDimension = {
  name: string;
  options: ProductDetailSizeOption[];
};
export type ProductDetailSizes = {
  dimensions: ProductDetailSizeDimension[];
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
  console.log(filters);

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
    .then((response) => response.data?.data ?? null)
    .catch((e: AxiosError) => {
      console.warn('getProduct failed', e.message);
      return null;
    });
};