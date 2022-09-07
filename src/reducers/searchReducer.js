import {
    API_SEARCH_REQUEST,
    API_SEARCH_SUCCESS,
    API_SEARCH_FAILURE,
    API_SEARCH_LIST_END,
    API_SEARCH_CLEAN,
    API_SEARCH_TEXT
} from "../actions/types";



const initialState = {
    loading: false,
    moreLoading: false,
    error: null,
    moreError: null,
    isListEnd: false,
    data: [],
    searchText: ""
}



export const searchReducer = (state = initialState, action) => {
    const { type, page } = action;
    switch (type) {
        case API_SEARCH_REQUEST:
            if (page === 1) {
                return { ...state, loading: true }
            } else {
                return { ...state, moreLoading: true }
            }
        case API_SEARCH_SUCCESS:
            return {
                ...state,
                data: [...state.data, ...action.data],
                error: '',
                loading: false,
                moreLoading: false
            };
        case API_SEARCH_FAILURE:
            return {
                ...state,
                error: action.error,
                loading: false,
                moreLoading: false
            };
        case API_SEARCH_LIST_END:
            return {
                ...state,
                isListEnd: true,
                loading: false,
                moreLoading: false
            };
        case API_SEARCH_CLEAN:
            return initialState
        default:
            return state;
    }
}

