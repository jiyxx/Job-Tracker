require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const logger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/error");
const passport = require("passport");
require("./config/passport");

const authRoutes = require("./routes/auth");
const applicationRoutes = require("./routes/application");
const notesRoutes = require("./routes/notes");

const app = express();

// Connect database
connectDB();

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(passport.initialize());
app.use(logger);

// Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notes", notesRoutes);

// 404 handler for unknown routes
app.use(notFound);

// Centralized error handler (replaces generic 500 handler)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});