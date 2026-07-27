const express = require("express");
const { body, validationResult } = require("express-validator");
const Note = require("../models/Note");
const { protect } = require("../middleware/auth");
const { AppError } = require("../middleware/error");
const { generateSummary } = require("../utils/openai");
 
const router = express.Router();
 
router.use(protect);
 
//  GET /api/notes
//  Get all notes of the logged-in user
//  search, tag
router.get("/", async (req, res, next) => {
  try {
    const { search, tag } = req.query;
    const query = { user: req.user._id, deletedAt: null };
    // search by tag
    if (tag) query.tags = tag;
    // search by title or content 
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }
    //fetch notes from db 
    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});
 
// @route   GET /api/notes/:id
router.get("/:id", async (req, res, next) => {
  try {
    // fetch single note by id and user
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!note) throw new AppError("Note not found", 404);
    res.json(note);
  } catch (err) {
    next(err);
  }
});
//  POST /api/notes
//  Create a new note
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
 
    try {
      const { title, content, tags, application } = req.body;
      const note = await Note.create({
        user: req.user._id,
        title,
        content,
        tags: tags || [],                                           
        application: application || null,
      });
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  }
); 

// PUT /api/notes/:id
// Edit a note
router.put("/:id", async (req, res, next) => {
  try {
    const update = { ...req.body };
    delete update.aiSummary;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, deletedAt: null },
      { ...update, aiSummary: "" },
      { returnDocument: "after", runValidators: true }
    );
    if (!note) throw new AppError("Note not found", 404);
    res.json(note);
  } catch (err) {
    next(err);
  }
});
 
//  DELETE /api/notes/:id
//  Soft-delete a note
router.delete("/:id", async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!note) throw new AppError("Note not found", 404);
    res.json({ message: "Note deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
});

 
// @route   POST /api/notes/:id/summarize
// @desc    Bonus feature — one-click AI summary of a note using Gemini API
router.post("/:id/summarize", async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!note) throw new AppError("Note not found", 404);
    const summary = await generateSummary({
      content: [
        `Title: ${note.title}`,
        note.tags?.length ? `Tags: ${note.tags.join(", ")}` : null,
        `Content: ${note.content}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      systemPrompt:
        [
          "You are an interview-prep coach and senior interviewer.",
          "Create a detailed, educational, actionable interview-prep overview from the note.",
          "Do not give a short summary.",
          "Return clean markdown with headings, bullet points, and bold lead-ins for important terms.",
          "Keep each section focused and complete. Prefer 3-5 bullets per section instead of long paragraphs.",
          "Use these sections exactly and write in simple language with practical guidance:",
          "# Overview",
          "# Key Topics",
          "# Detailed Explanation of Each Topic",
          "# Interview Questions",
          "# Follow-up Questions",
          "# Coding Problems (if applicable)",
          "# Common Mistakes",
          "# What to Focus On",
          "# Revision Checklist",
          "# Final Preparation Plan",
          "For each topic, explain why it matters in interviews, what the candidate should revise, and how to prepare.",
          "Include likely questions, follow-up questions, best approaches, and common mistakes when relevant.",
          "If the note includes interview experience, extract all important topics and prioritize the most important ones for revision.",
          "Use bold formatting for key topic names, action items, and revision priorities.",
        ].join(" "),
    });
 
    note.aiSummary = summary;
    await note.save();
 
    res.json({ id: note._id, aiSummary: summary });
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;
 