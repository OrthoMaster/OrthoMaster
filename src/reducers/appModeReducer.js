import {
    APP_MODE_CHANGE
} from "../actions/types";

export const MODES = {
    orthomaster : 'default',
    thuasne : 'thuasne'
}


const initialState = {
    isLoading: true,
    value: 'default',
}

export const selectModeValue = state => state.mode.value


export const appModeReducer = (state = initialState, action) => {
    const { type, mode } = action;
    switch (type) {
        case APP_MODE_CHANGE:
            return { ...state, value: mode }
        default:
            return state;
    }
}

