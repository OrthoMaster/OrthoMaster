import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';
import { Platform } from 'react-native';

/**
 * Daily action : Quiz and Podcast
 */
export const getDailyAction = async () => {
  return axiosInstance
    .get(`${baseUrl}/daily-action`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Store user's answer 
 */
export const answerDailyQuestion = async (questionId: string, answerId: string) => {
  return axiosInstance
    .put(`${baseUrl}/daily-question`, { questionId, answerId })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Get question by id
 */
export const getQuestionById = async (id: string | number) => {
  return axiosInstance
    .get(`${baseUrl}/daily-question/${id}`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Get podcast by id
 */
export const getPodcastById = async (id: string | number) => {
  return axiosInstance
    .get(`${baseUrl}/podcast/${id}`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Get infographic by id
 */
export const getInfographicById = async (id: string | number) => {
  return axiosInstance
    .get(`${baseUrl}/infographic/${id}`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Count times the podcast is played
 */
export const countTimesPodcast = async (podcastId: string) => {
  return axiosInstance
    .put(`${baseUrl}/daily-podcast/count`, { podcastId })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Get search histories and trending keywords
 */
export const getPreSearch = async () => {
  return axiosInstance
    .get(`${baseUrl}/content/pre-search`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Search content
 */
export const search = async (
  keyword: string,
  category: string,
  lessonsPage: number = 1,
  videosPage: number = 1
) => {
  return axiosInstance
    .post(`${baseUrl}/content/search`, {
      keyword: keyword,
      category: category,
      lessons_page: lessonsPage,
      videos_page: videosPage
    })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Delete 1 keyword from search history
 */
export const deleteKeyword = async (id: string) => {
  return axiosInstance
    .delete(`${baseUrl}/content/search/history/${id}`)
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Clear all search history
 */
export const clearSearchHistory = async () => {
  return axiosInstance
    .delete(`${baseUrl}/content/search/histories`)
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/* ---- Assistant de recherche IA ---- */

export type AiSearchErrorCode =
  | 'ai_unavailable'
  | 'session_expired'
  | 'rate_limited'
  | 'invalid_request'
  | 'network';

export interface AiSearchOption {
  id: string;
  label: string;
  count: number | null;
}

export interface AiSearchVideo {
  id_content: string | number;
  title: string;
  author?: string | null;
  thumbnail?: string | null;
  matched_chapter?: { label: string; seconds: number } | null;
  [key: string]: any;
}

export type AiSearchData =
  | { session_id: string; type: 'question'; message: string; options: AiSearchOption[]; total: number | null }
  | { session_id: string; type: 'results'; message: string; videos: AiSearchVideo[]; total: number };

export type AiSearchResult =
  | { success: true; data: AiSearchData }
  | { success: false; code: AiSearchErrorCode };

export interface AiSearchPayload {
  session_id?: string | null;
  message?: string;
  option_id?: string;
  action?: 'show';
}

/**
 * Get AI search availability (the assistant button is hidden when false)
 */
export const getAiSearchStatus = async (): Promise<boolean> => {
  return axiosInstance
    .get(`${baseUrl}/content/ai-search/status`)
    .then((response) => response.data?.success == true && response.data?.data?.available === true)
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * One turn of the AI search conversation
 */
export const aiSearch = async (payload: AiSearchPayload): Promise<AiSearchResult> => {
  return axiosInstance
    .post(`${baseUrl}/content/ai-search`, payload)
    .then((response): AiSearchResult => {
      if (response.data?.success == true) {
        return { success: true, data: response.data.data };
      }

      return { success: false, code: response.data?.code ?? 'ai_unavailable' };
    })
    .catch((e: AxiosError<any>): AiSearchResult => {
      // Le serveur renvoie un code métier même en erreur HTTP (410, 429, 503) :
      // sans réponse du tout, c'est un problème de réseau.
      return { success: false, code: e.response?.data?.code ?? 'network' };
    });
}

/**
 * Get S3 Url
 */
export const getS3Url = async (content: string) => {
  return axiosInstance
    .post(`${baseUrl}/content/s3-url`, { content })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.url;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}


/**
 * Get event - congres
 */
export const getEvents = async () => {
  return axiosInstance
    .get(`${baseUrl}/media/events`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get content of media
 */
export const getContent = async (contentId: string | number) => {
  return axiosInstance
    .get(`${baseUrl}/media/content`, { params: { contentId } })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get content of tool
 */
export const getToolContent = async (contentId: string) => {
  return axiosInstance
    .get(`${baseUrl}/media/tool/content`, { params: { contentId } })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get CloudFront Signed Cookies for video access
 */
export const fetchVideoAccess = async (videoCode: string) => {
  // Web
  if (Platform.OS === 'web') {
    return axiosInstance
      .post(
        `${baseUrl}/video/${videoCode}/signed-cookies`,
        {},
        { withCredentials: true }
      )
      .then((response) => {
        if (response.data?.success == true) {
          return {
            title: response.data?.video?.title,
            url: response.data?.url,
            highlights: response.data?.highlights || [],
            subtitles: response.data.subtitles || [],
          };
        }
        return null;
      })
      .catch((e: AxiosError) => {
        return null;
      });
  }

  // Mobile
  return axiosInstance
    .post(`${baseUrl}/video/${videoCode}/proxy-url`)
    .then((response) => {
      if (response.data?.success == true) {
        return {
          title: response.data?.video?.title,
          url: response.data?.url,
          highlights: response.data?.highlights || [],
          subtitles: response.data.subtitles || [],
        };
      }
      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Get newest media
 */
export const getNewests = async () => {
  return axiosInstance
    .get(`${baseUrl}/media/newests`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get related media
 */
export const getRelated = async (id: number) => {
  return axiosInstance
    .get(`${baseUrl}/media/${id}/related`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get trend media
 */
export const getTrends = async () => {
  return axiosInstance
    .get(`${baseUrl}/media/trends`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get media by categories
 */
export const getCategories = async () => {
  return axiosInstance
    .get(`${baseUrl}/media/categories`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Get event media
 */
export const getEventMedias = async (id: number) => {
  return axiosInstance
    .get(`${baseUrl}/media/events/${id}/content`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Track media
 */
export const trackMedia = async (id: number) => {
  return axiosInstance
    .post(`${baseUrl}/media/${id}/track`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}

/**
 * Track progress
 */
export const trackProgress = async (
  id: number,
  payload: { watched_seconds: number; max_position: number; duration?: number }
) => {
  return axiosInstance
    .post(`${baseUrl}/media/track/${id}/progress`, payload)
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}