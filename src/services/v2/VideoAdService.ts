import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

// ---------- Types ----------
export interface VideoAd {
    id: number;
    title: string;
    description: string | null;
    video_url: string;
    thumbnail_url: string | null;
    ads_company: {
        id: number;
        name: string | null;
    };
}

export interface RecordViewPayload {
    is_completed?: boolean;
    is_contacted?: boolean;
    user_id?: number;
    content_id?: number;
}

export interface RecordImpressionPayload {
    user_id?: number;
    content_id?: number;
}

// ---------- API ----------

/**
 * GET /video-ads/feed
 * Get video list ( default 4 )
 */
export const getFeed = async (
    contentId?: number,
    limit?: number
): Promise<VideoAd[] | null> => {
    const params: Record<string, number> = {};
    if (contentId != null) params.content_id = contentId;
    if (limit != null) params.limit = limit;

    return axiosInstance
        .get(`${baseUrl}/video-ads/feed`, { params })
        .then((response) => {
            // Backend trả { data: [...] }
            return (response.data?.data as VideoAd[]) ?? null;
        })
        .catch((_e: AxiosError) => {
            return null;
        });
};

/**
 * POST /video-ads/{id}/impression
 */
export const recordImpression = async (
    videoAdId: number,
    payload: RecordImpressionPayload = {}
): Promise<boolean> => {
    return axiosInstance
        .post(`${baseUrl}/video-ads/${videoAdId}/impression`, payload)
        .then(() => true)
        .catch((_e: AxiosError) => false);
};

/**
 * POST /video-ads/{id}/view
 */
export const recordView = async (
    videoAdId: number,
    payload: RecordViewPayload = {}
): Promise<boolean> => {
    return axiosInstance
        .post(`${baseUrl}/video-ads/${videoAdId}/view`, payload)
        .then(() => true)
        .catch((_e: AxiosError) => false);
};

/**
 * POST /video-ads/{id}/contact
 */
export const contactAds = async (
    videoAdId: number,
    payload: RecordViewPayload = {}
): Promise<boolean> => {
    return axiosInstance
        .post(`${baseUrl}/video-ads/${videoAdId}/contact`, payload)
        .then(() => true)
        .catch((_e: AxiosError) => false);
};