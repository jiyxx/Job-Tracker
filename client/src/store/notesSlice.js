import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchNotes = createAsyncThunk(
  "notes/fetchAll",
  async (search = "", { rejectWithValue }) => {
    try {
      const params = search ? { search } : {};
      const { data } = await api.get("/notes", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load notes",
      );
    }
  },
);

export const createNote = createAsyncThunk(
  "notes/create",
  async (noteData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/notes", noteData);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create note",
      );
    }
  },
);

export const updateNote = createAsyncThunk(
  "notes/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/notes/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update note",
      );
    }
  },
);

export const deleteNote = createAsyncThunk(
  "notes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/notes/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete note",
      );
    }
  },
);

export const generateAiSummary = createAsyncThunk(
  "notes/generateAiSummary",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/notes/${id}/summarize`);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "AI summary generation failed",
      );
    }
  },
);

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  summaryLoadingId: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    resetNotesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchNotes
      .addCase(fetchNotes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // createNote
      .addCase(createNote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // updateNote
      .addCase(updateNote.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n) => n._id === action.payload._id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      // deleteNote
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload);
      })
      // generateAiSummary
      .addCase(generateAiSummary.pending, (state, action) => {
        state.summaryLoadingId = action.meta.arg;
      })
      .addCase(generateAiSummary.fulfilled, (state, action) => {
        state.summaryLoadingId = null;
        const note = state.items.find((n) => n._id === action.payload.id);
        if (note) {
          note.aiSummary = action.payload.aiSummary;
        }
      })
      .addCase(generateAiSummary.rejected, (state, action) => {
        state.summaryLoadingId = null;
      });
  },
});

export const { resetNotesState } = notesSlice.actions;
export default notesSlice.reducer;
