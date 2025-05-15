
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
export const store = configureStore({
  reducer,
})
// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore['dispatch']
