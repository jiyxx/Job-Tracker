import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// --- Async thunks ---

// Fetch all applications once (filtering happens in Redux / frontend)
export const fetchApplications = createAsyncThunk(
  "applications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/applications");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load applications");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "applications/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/applications/stats");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load stats");
    }
  }
);

export const createApplication = createAsyncThunk(
  "applications/create",
  async (applicationData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/applications", applicationData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create application");
    }
  }
);

export const updateApplication = createAsyncThunk(
  "applications/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/applications/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update application");
    }
  }
);

export const updateStatus = createAsyncThunk(
  "applications/updateStatus",
  async ({ id, status, interviewDateTime }, { rejectWithValue }) => {
    try {
      const body = { status };
      if (interviewDateTime) body.interviewDateTime = interviewDateTime;
      const { data } = await api.patch(`/applications/${id}/status`, body);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);

export const deleteApplication = createAsyncThunk(
  "applications/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/applications/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete application");
    }
  }
);

const initialState = {
  items: [],
  stats: null,
  status: "idle", // idle | loading | succeeded | failed — for applications LIST
  error: null,
  statsStatus: "idle", // idle | loading | succeeded | failed — for dashboard STATS
  statsError: null,
  filters: {
    status: "",
    company: "",
    from: "",
    to: "",
    search: "",
  },
};

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetApplicationsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchApplications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Stats
      .addCase(fetchStats.pending, (state) => {
        state.statsStatus = "loading";
        state.statsError = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsStatus = "succeeded";
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.statsStatus = "failed";
        state.statsError = action.payload;
      })
      // Create
      .addCase(createApplication.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.statsStatus = "idle"; // Reset stats cache so dashboard updates
      })
      // Update (full edit)
      .addCase(updateApplication.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.statsStatus = "idle";
      })
      // Status update
      .addCase(updateStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.statsStatus = "idle";
      })
      // Delete
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a._id !== action.payload);
        state.statsStatus = "idle";
      });
  },
});

export const { setFilters, clearFilters, resetApplicationsState } = applicationsSlice.actions;
export default applicationsSlice.reducer;