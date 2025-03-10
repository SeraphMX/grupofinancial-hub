import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api'
import authReducer from './slices/authSlice'
import creditReducer from './slices/creditSlice'
import notificationsReducer from './slices/notificationsSlice'
import requestReducer from './slices/requestSlice'
import themeReducer from './slices/themeSlice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    theme: themeReducer,
    notifications: notificationsReducer,
    credit: creditReducer,
    requests: requestReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware)
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
