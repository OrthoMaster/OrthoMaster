
import { configureStore, combineReducers } from '@reduxjs/toolkit'

import {searchReducer} from './reducers/searchReducer';
import {contentReducer} from './reducers/contentReducer';
import { notificationReducer } from './reducers/notificationReducer';
import { appModeReducer } from './reducers/appModeReducer';

const reducer = combineReducers({
  // here we will be adding reducers
  search: searchReducer,
  content: contentReducer,
  notification: notificationReducer,
  mode: appModeReducer
})
const store = configureStore({
  reducer,
})
export default store;
