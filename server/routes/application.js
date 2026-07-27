const express = require("express");
const { body, validationResult } = require("express-validator");
const Application = require("../models/Application");
const { APPLICATION_STATUSES } = require("../models/Application");
const { protect } = require("../middleware/auth");
const { AppError } = require("../middleware/error");
const { generateSummary } = require("../utils/openai");

const router = express.Router();

// Every route below requires a logged-in user
router.use(protect);

//  GET /api/applications
router.get("/", async (req, res, next) => {
  try {
    // GET all applications for the logged-in user
    const { status, company, from, to, search } = req.query;

    const query = { user: req.user._id };

    if (status) query.status = status;
    if (company) query.companyName = { $regex: company, $options: "i" };

    // filter by date range 
    if (from || to) {
      query.dateApplied = {};
      if (from) query.dateApplied.$gte = new Date(from);
      if (to) query.dateApplied.$lte = new Date(to);
    }
    // filter by company name or role 
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const applications = await Application.find(query).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

//  GET /api/applications/stats
// Dashboard summary counts + status breakdown for pie chart
router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, active, offers, rejected, byStatus] = await Promise.all([
      //count all applications of logged-in user
      Application.countDocuments({ user: userId }),
      //active application
      Application.countDocuments({
        user: userId,
        status: { $in: ["Applied", "Shortlisted", "Interview Scheduled"] },
      }),
  
      //offers counts
      Application.countDocuments({ user: userId, status: "Offer Received" }),
      //rejected counts
      Application.countDocuments({ user: userId, status: "Rejected" }),
      //group by status for pie chart
      Application.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    // return the counts and the breakdown by status
    res.json({
      total,
      active,
      offers,
      rejected,
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id
router.get("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) throw new AppError("Application not found", 404);

    res.json(application);
  } catch (err) {
    next(err);
  }
});

// POST /api/applications
router.post(
  "/",
  [
    //create a new application with validation
    body("companyName").trim().notEmpty().withMessage("Company name is required"),
    body("role").trim().notEmpty().withMessage("Role is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("dateApplied")
      .notEmpty()
      .isISO8601()
      .withMessage("dateApplied must be a valid date"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const application = await Application.create({
        ...req.body,
        user: req.user._id,
      });
      res.status(201).json(application);
    } catch (err) {
      next(err);
    }
  }
);

//  PUT /api/applications/:id
//  Edit an existing application
router.put("/:id", async (req, res, next) => {
  try {
    const update = { ...req.body };
    delete update.aiSummary;

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...update, aiSummary: "" },
      { returnDocument: "after", runValidators: true }
    );

    if (!application) throw new AppError("Application not found", 404);

    res.json(application);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status
router.patch(
  "/:id/status",
  [
    body("status")
      .isIn(APPLICATION_STATUSES)
      .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(", ")}`),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const update = { status: req.body.status };
      // matches interviewDateTime field in the model
      if (req.body.interviewDateTime) {
        update.interviewDateTime = req.body.interviewDateTime;
      }

      const application = await Application.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        update,
        { returnDocument: "after", runValidators: true }
      );

      if (!application) throw new AppError("Application not found", 404);

      res.json(application);
    } catch (err) {
      next(err);
    }
  }
);

// @route   POST /api/applications/:id/summarize
// @desc    Generate an AI summary of the application details
router.post("/:id/summarize", async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) throw new AppError("Application not found", 404);

    const summary = await generateSummary({
      content: [
        `Company: ${application.companyName}`,
        `Role: ${application.role}`,
        `Status: ${application.status}`,
        application.jobDescription ? `Job Description: ${application.jobDescription}` : null,
        application.notes ? `Personal Notes: ${application.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
      systemPrompt:
        [
          "You are an interview-prep coach and hiring manager.",
          "Create a detailed, educational, actionable overview for this job application.",
          "Do not produce a short summary.",
          "Return clean markdown with headings, bullet points, and bold lead-ins for important terms.",
          "Keep each section focused and complete. Prefer 3-5 bullets per section instead of long paragraphs.",
          "Use these sections exactly and tailor them to the application context:",
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
          "Explain the role, status, job description, and personal notes in simple language.",
          "Highlight what the candidate should revise first, common mistakes to avoid, and likely interview questions based on the application details.",
          "Suggest related concepts, best approaches, and a clear preparation priority.",
          "Use bold formatting for key topic names, action items, and revision priorities.",
        ].join(" "),
    });

    application.aiSummary = summary;
    await application.save();

    res.json({ id: application._id, aiSummary: summary });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/applications/:id
// @desc    Delete an application
router.delete("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) throw new AppError("Application not found", 404);

    res.json({ message: "Application deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
});


module.exports = router;

