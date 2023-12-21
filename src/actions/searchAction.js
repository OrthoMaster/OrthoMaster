import {
  API_SEARCH_FAILURE,
  API_SEARCH_LIST_END,
  API_SEARCH_REQUEST,
  API_SEARCH_SUCCESS,
} from "./types";



export const getSearchList = (params) => (dispatch) => {
  dispatch({
    type: API_SEARCH_REQUEST,
    page: params.page,
  })

}
export const searchSuccess = (params) => (dispatch) => {
  dispatch({
    type: API_SEARCH_SUCCESS,
    data: params.data
  })

}
export const searchFailure = (params) => (dispatch) => {
  dispatch({
    type: API_SEARCH_FAILURE,
    error: params.error
  })

}

export const listEnded = (params) => (dispatch) => {


  dispatch({ type: API_SEARCH_LIST_END })

  
}

