import {
  API_SEARCH_FAILURE,
  API_SEARCH_LIST_END,
  API_SEARCH_REQUEST,
  API_SEARCH_SUCCESS,
  API_SEARCH_TEXT,
} from "./types";

import { fetchSearchList } from "../services/SearchService";



export const getSearchList = (params) => (dispatch) => {



  dispatch({
    type: API_SEARCH_REQUEST,
    page: params.page,
  })

  fetchSearchList({ contentType: params.payload.contentType, filters: params.payload.filters, body: params.payload.body, searchText: params.payload.searchText }, params.page).then(
    (data) => {
      if (data.length == 0) {
        dispatch({type: API_SEARCH_LIST_END})
      }
      
      dispatch({
        type: API_SEARCH_SUCCESS,
        data: data
      })
    },
    (error) => {
      dispatch({
        type: API_SEARCH_FAILURE,
        error: error.response.data
      })
    }
  )
}

