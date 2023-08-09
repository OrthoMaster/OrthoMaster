import {
APP_MODE_CHANGE
} from "./types";




export const actionChangeAppMode = (mode) => (dispatch) => {
  dispatch({
    type: APP_MODE_CHANGE,
    mode: mode,
  })
}

