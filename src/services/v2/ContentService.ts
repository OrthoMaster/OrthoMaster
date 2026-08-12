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
export const getContent = async (contentId: string) => {
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