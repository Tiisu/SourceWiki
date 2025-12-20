import Submission from '../models/Submission.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';
// 1. IMPORT THE EMAIL SERVICE
import { sendEmail } from '../services/emailService.js';

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private
export const createSubmission = async (req, res, next) => {
  try {
    const { url, title, publisher, country, category, wikipediaArticle, fileType, fileName } = req.body;

    const submission = await Submission.create({
      url,
      title,
      publisher,
      country,
      category,
      wikipediaArticle,
      fileType: fileType || 'url',
      fileName,
      submitter: req.user.id
    });

    // Award points to user
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: 10 }
    });

    // 2. IMPORTANT: Added 'email' to populate so we can send the notification
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('submitter', 'username country email');

    // --- EMAIL NOTIFICATION LOGIC START ---
    try {
      const submitterEmail = populatedSubmission.submitter.email;
      const submitterName = populatedSubmission.submitter.username;
      
      // Email A: Notify Submitter
      const submitterHtml = `
        <h3>Hello ${submitterName},</h3>
        <p>Your submission for <strong>${title}</strong> has been received.</p>
        <p>It is now pending review by a verifier for <strong>${country}</strong>.</p>
        <p>Best,<br>WikiSourceVerifier Team</p>
      `;
      
      // Email B: Notify Verifier
      // Helper function to find the right email (defined at bottom of file)
      const verifierEmail = getVerifierEmail(country);
      const verifierHtml = `
        <h3>New Submission Pending Review</h3>
        <p>User <strong>${submitterName}</strong> submitted a new source for <strong>${country}</strong>.</p>
        <p>Please log in to verify.</p>
      `;

      // Send both emails (using Promise.allSettled so one failure doesn't stop the other)
      await Promise.allSettled([
        sendEmail(submitterEmail, "Submission Received", submitterHtml),
        sendEmail(verifierEmail, `Action Required: New Submission for ${country}`, verifierHtml)
      ]);

    } catch (emailErr) {
      // Log error but don't fail the request
      console.error("Email notification failed:", emailErr);
    }
    // --- EMAIL NOTIFICATION LOGIC END ---

    res.status(201).json({
      success: true,
      submission: populatedSubmission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submissions with filters
// @route   GET /api/submissions
// @access  Public
export const getSubmissions = async (req, res, next) => {
  try {
    const { country, category, status, page = 1, limit = 20, search } = req.query;

    const query = {};

    if (country) query.country = country;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const submissions = await Submission.find(query)
      .populate('submitter', 'username country')
      .populate('verifier', 'username country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments(query);

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Public
export const getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('submitter', 'username email country role points badges')
      .populate('verifier', 'username country role');

    if (!submission) {
      return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's submissions
// @route   GET /api/submissions/my/submissions
// @access  Private
export const getMySubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ submitter: req.user.id })
      .populate('verifier', 'username country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments({ submitter: req.user.id });

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update submission (only by submitter before verification)
// @route   PUT /api/submissions/:id
// @access  Private
export const updateSubmission = async (req, res, next) => {
  try {
    let submission = await Submission.findById(req.params.id);

    if (!submission) {
      return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    // Check if user is the submitter
    if (submission.submitter.toString() !== req.user.id) {
      return next(new AppError('Not authorized to update this submission', 403, ErrorCodes.UNAUTHORIZED_ACCESS));
    }

    // Can't update if already verified
    if (submission.status !== 'pending') {
      return next(new AppError('Cannot update a verified submission', 400, ErrorCodes.SUBMISSION_LOCKED));
    }

    const { title, publisher, wikipediaArticle, category } = req.body;

    submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { title, publisher, wikipediaArticle, category },
      { new: true, runValidators: true }
    ).populate('submitter', 'username country');

    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete submission (only by submitter if pending)
// @route   DELETE /api/submissions/:id
// @access  Private
export const deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    // Check if user is the submitter or admin
    if (submission.submitter.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this submission', 403, ErrorCodes.UNAUTHORIZED_ACCESS));
    }

    await submission.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify submission (verifier/admin only)
// @route   PUT /api/submissions/:id/verify
// @access  Private (verifier, admin)
export const verifySubmission = async (req, res, next) => {
  try {
    const { status, credibility, verifierNotes } = req.body;
    console.log('Verification request:', { status, credibility, verifierNotes });

    let submission = await Submission.findById(req.params.id);

    if (!submission) {
      return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    if (submission.status !== 'pending') {
      return next(new AppError('Submission has already been verified', 400, ErrorCodes.SUBMISSION_LOCKED));
    }

    if (status === 'rejected') {
      submission.status = 'rejected';
    } else if (status === 'approved' && credibility) {
      submission.status = 'approved';
      submission.credibility = credibility;
    } else if (status === 'approved' && !credibility) {
      return next(new AppError('Credibility rating is required for approved submissions', 400, ErrorCodes.INVALID_INPUT));
    } else {
      return next(new AppError('Invalid status provided', 400, ErrorCodes.INVALID_INPUT));
    }

    submission.verifier = req.user.id;
    submission.verifierNotes = verifierNotes;
    submission.verifiedAt = Date.now();

    await submission.save();

    if (status === 'approved') {
      const points = credibility === 'credible' ? 25 : 10;
      await User.findByIdAndUpdate(submission.submitter, {
        $inc: { points: points }
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: 5 }
    });

    submission = await Submission.findById(submission._id)
      .populate('submitter', 'username country')
      .populate('verifier', 'username country');

    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get submissions pending verification for user's country
// @route   GET /api/submissions/pending/country
// @access  Private (verifier, admin)
export const getPendingSubmissionsForCountry = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'pending' };
    
    if (req.user.role !== 'admin') {
      query.country = req.user.country;
    }

    const submissions = await Submission.find(query)
      .populate('submitter', 'username country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments(query);

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get submission statistics
// @route   GET /api/submissions/stats
// @access  Public
export const getSubmissionStats = async (req, res, next) => {
  try {
    const { country } = req.query;
    const matchStage = country ? { country } : {};

    const stats = await Submission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          primary: { $sum: { $cond: [{ $eq: ['$category', 'primary'] }, 1, 0] } },
          secondary: { $sum: { $cond: [{ $eq: ['$category', 'secondary'] }, 1, 0] } },
          unreliable: { $sum: { $cond: [{ $eq: ['$category', 'unreliable'] }, 1, 0] } }
        }
      }
    ]);

    const countryStats = await Submission.aggregate([
      { $match: matchStage },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || { total: 0, pending: 0, approved: 0, rejected: 0, primary: 0, secondary: 0, unreliable: 0 },
      topCountries: countryStats
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Get Verifier Email based on Country
// This uses the ENV variables you set up earlier
const getVerifierEmail = (country) => {
    // You can add more countries here as needed
    const verifiers = {
        'Ghana': process.env.GHANA_VERIFIER_EMAIL,
        'Nigeria': process.env.NIGERIA_VERIFIER_EMAIL,
    };
    
    // Return specific verifier or fallback to Admin Email (or a default)
    return verifiers[country] || process.env.ADMIN_EMAIL || 'admin@wikisourceverifier.org';
};