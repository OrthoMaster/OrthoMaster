
import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'


import {authReducer} from "./reducers/auth";
import {searchReducer} from './reducers/searchReducer';
import {contentReducer} from './reducers/contentReducer';

const reducer = combineReducers({
  // here we will be adding reducers
  auth: authReducer,
  search: searchReducer,
  content: contentReducer
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
