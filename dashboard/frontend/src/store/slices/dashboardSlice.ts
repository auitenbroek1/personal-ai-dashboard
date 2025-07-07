import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardState {
  isConnected: boolean;
  lastUpdate: Date | null;
  currentPage: string;
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
  }>;
}

const initialState: DashboardState = {
  isConnected: false,
  lastUpdate: null,
  currentPage: 'overview',
  notifications: [],
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    updateLastUpdate: (state) => {
      state.lastUpdate = new Date();
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    addNotification: (state, action: PayloadAction<{
      type: 'info' | 'warning' | 'error' | 'success';
      message: string;
    }>) => {
      state.notifications.push({
        id: Date.now().toString(),
        ...action.payload,
        timestamp: new Date(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setConnected,
  updateLastUpdate,
  setCurrentPage,
  addNotification,
  removeNotification,
  clearNotifications,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;