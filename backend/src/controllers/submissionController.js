import Submission from '../models/Submission.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';


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

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('submitter', 'username country');

    // Emit real-time notification for new submission
    if (global.webSocketService) {
      global.webSocketService.broadcastSubmissionCreated(populatedSubmission);
    }

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

    // Emit real-time notification for submission update
    if (global.webSocketService) {
      global.webSocketService.broadcastSubmissionUpdated(submission, req.user);
    }

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

    // Emit real-time notification for submission deletion
    if (global.webSocketService) {
      global.webSocketService.broadcastSubmissionDeleted(submission, req.user);
    }

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

    // Handle different verification outcomes
    if (status === 'rejected') {
      // Rejected submissions don't need credibility rating
      submission.status = 'rejected';
    } else if (status === 'approved' && credibility) {
      // Approved with credibility rating
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

    // Award points to submitter if approved
    if (status === 'approved') {
      // More points for credible sources
      const points = credibility === 'credible' ? 25 : 10;
      await User.findByIdAndUpdate(submission.submitter, {
        $inc: { points: points }
      });
    }

    // Award points to verifier
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: 5 }
    });


    submission = await Submission.findById(submission._id)
      .populate('submitter', 'username country')
      .populate('verifier', 'username country');

    // Emit real-time notification for submission verification
    if (global.webSocketService) {
      global.webSocketService.broadcastSubmissionVerified(submission, req.user);
    }

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

    // Build query based on user role
    let query = { status: 'pending' };
    
    // If user is admin, show all pending submissions
    // If user is verifier, show only their country's submissions
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
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          primary: {
            $sum: { $cond: [{ $eq: ['$category', 'primary'] }, 1, 0] }
          },
          secondary: {
            $sum: { $cond: [{ $eq: ['$category', 'secondary'] }, 1, 0] }
          },
          unreliable: {
            $sum: { $cond: [{ $eq: ['$category', 'unreliable'] }, 1, 0] }
          }
        }
      }
    ]);

    const countryStats = await Submission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        primary: 0,
        secondary: 0,
        unreliable: 0
      },
      topCountries: countryStats
    });
  } catch (error) {
    next(error);
  }
};
