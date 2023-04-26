
import { configureStore, combineReducers } from '@reduxjs/toolkit'

import {authReducer} from "./reducers/auth";
import {searchReducer} from './reducers/searchReducer';
import {contentReducer} from './reducers/contentReducer';
import { notificationReducer } from './reducers/notificationReducer';

const reducer = combineReducers({
  // here we will be adding reducers
  auth: authReducer,
  search: searchReducer,
  content: contentReducer,
  notification: notificationReducer
})
const store = configureStore({
  reducer,
})
export default store;


// import { configureStore } from "@reduxjs/toolkit";
// //import rootReducer from "./reducers";


// const store = configureStore({
//     auth,

// });
// export default store;
