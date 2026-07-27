const express = require("express");
const { body, validationResult } = require("express-validator");
const Note = require("../models/Note");
const { protect } = require("../middleware/auth");
const { AppError } = require("../middleware/error");
 
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
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
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
// @desc    Bonus feature — one-click AI summary of a note using OpenAI API
router.post("/:id/summarize", async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!note) throw new AppError("Note not found", 404);
 
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError("OpenAI API key not configured on server", 500);
    }
 
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Summarize the user's interview/job-prep note in 3-4 concise bullet points. Keep the key facts and action items, cut filler.",
          },
          { role: "user", content: note.content },
        ],
        max_tokens: 200,
      }),
    });
 
    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(`OpenAI API error: ${errText}`, 502);
    }
 
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || "";
 
    note.aiSummary = summary;
    await note.save();
 
    res.json({ id: note._id, aiSummary: summary });
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;
 