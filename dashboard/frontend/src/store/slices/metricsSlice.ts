import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Metric {
  id: string;
  timestamp: Date;
  metric_type: string;
  value: number;
  metadata?: Record<string, any>;
}

interface MetricsState {
  metrics: Metric[];
  loading: boolean;
  error: string | null;
}

const initialState: MetricsState = {
  metrics: [],
  loading: false,
  error: null,
};

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setMetrics: (state, action: PayloadAction<Metric[]>) => {
      state.metrics = action.payload;
    },
    addMetric: (state, action: PayloadAction<Metric>) => {
      state.metrics.push(action.payload);
      // Keep only last 1000 metrics to prevent memory issues
      if (state.metrics.length > 1000) {
        state.metrics = state.metrics.slice(-1000);
      }
    },
    clearMetrics: (state) => {
      state.metrics = [];
    },
  },
});

export const {
  setLoading,
  setError,
  setMetrics,
  addMetric,
  clearMetrics,
} = metricsSlice.actions;

export default metricsSlice.reducer;