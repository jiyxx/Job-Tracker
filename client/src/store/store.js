import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import applicationsReducer from "./applicationsSlice";
import notesReducer from "./notesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    notes: notesReducer,
  },
});
