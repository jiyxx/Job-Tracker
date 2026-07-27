const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: false,
            index: true,    
        },
        title: {
            type: String,
            required: [true, "Note title is required"],
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Note content is required"],   
        },
        tags: {
            type: [String],
            default: [],
        },
        aiSummary: {
            type: String,
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        deletedAt: {
            type: Date,
            default: null,  
        },
    },
    { timestamps: true }
);

noteSchema.index({ user: 1, tags: 1});
noteSchema.index({ title: 1, content: 1 });

module.exports = mongoose.model("Note", noteSchema);