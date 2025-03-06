import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface NotificationsState {
  notificationOpened: boolean
  notificationType: string | null
}

const initialState: NotificationsState = {
  notificationOpened: false,
  notificationType: null
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationOpened(state, action: PayloadAction<boolean>) {
      state.notificationOpened = action.payload
    },
    setNotificationType(state, action: PayloadAction<string | null>) {
      state.notificationType = action.payload
    }
  }
})

export const { setNotificationOpened, setNotificationType } = notificationsSlice.actions
export default notificationsSlice.reducer
