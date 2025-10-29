import axios from "axios";

const baseUrl_v2 = process.env.EXPO_PUBLIC_API_V2_URL

interface GetContentParams {
    id: string | number;
    page?: number;
}

interface CheckExistContent {
    contentId: string | number;
}

export const checkExistContent = async ({ contentId }: CheckExistContent) => {
    const result = await axios
        .get(`${baseUrl_v2}/lessons/findContentId/${contentId}`)
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            return e;
        });

    if (result && 'success' in result && 'data' in result && result.success === true) {
        return result.data;
    }

    return null;
}

export const getLessonContent = async ({ id, page = 1 }: GetContentParams) => {
    const params = new URLSearchParams({
        page: page.toString(),
    });

    return axios
        .get(`${baseUrl_v2}/lessons/${id}/content?${params}`)
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            throw e;
        });
}