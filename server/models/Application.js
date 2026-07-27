const mongoose = require("mongoose");

const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Offer Received",
  "Rejected",
];

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role/Position is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    dateApplied: {
      type: Date,
      required: [true, "Date applied is required"],
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "Applied",
    },
    jobLink: {
      type: String,
      required: false,
      trim: true,
    },
    jobDescription: {
      type: String,
      required: false,
      trim: true,
    },
    interviewDateTime: {
      type: Date,
      required: false,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

// NOTE: this unique index means a user cannot create two applications with
// the same companyName + role combo (e.g. reapplying after rejection will
// throw a duplicate-key error). Remove this index if that's not what you want.
applicationSchema.index({ user: 1, companyName: 1, role: 1 }, { unique: true });
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, dateApplied: -1 });

module.exports = mongoose.model("Application", applicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;