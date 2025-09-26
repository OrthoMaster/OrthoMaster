import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/lesson/"

interface GetContentParams {
    id: string | number;
    page?: number;
    limit?: number;
}

export const getLessonContent = async ({ id, page = 1, limit = 5 }: GetContentParams) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    
    return axios
        .get(`${baseurl}${id}/content?${params}`)
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            throw e;
        });
}