import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import agentsReducer from './slices/agentsSlice';
import tasksReducer from './slices/tasksSlice';
import metricsReducer from './slices/metricsSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    agents: agentsReducer,
    tasks: tasksReducer,
    metrics: metricsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['dashboard/updateLastUpdate'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;