import { fn, col, literal } from 'sequelize';
import Submission, { includeSubmitter, includeVerifier } from '../models/Submission.js';
import User from '../models/User.js';
import { paginate, searchAny } from '../models/helpers.js';
import { countWhen } from '../models/queries.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';
import { sendEmail } from '../services/emailService.js';



const listResponse = (res, { rows, count }, page, limit) =>
  res.status(200).json({
    success: true,
    count: rows.length,
    total: count,
    page,
    pages: Math.ceil(count / limit),
    submissions: rows
  });

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
    await User.increment({ points: 10 }, { where: { id: req.user.id } });

    // Email is included so we can send the notification
    const populatedSubmission = await Submission.findByPk(submission.id, {
      include: [includeSubmitter(['username', 'country', 'email'])]
    });

    // --- EMAIL NOTIFICATION LOGIC START ---
    try {
      const submitterEmail = populatedSubmission.submitterUser.email;
      const submitterName = populatedSubmission.submitterUser.username;

      // Email A: Notify Submitter
      const submitterHtml = `
        <h3>Hello ${submitterName},</h3>
        <p>Your submission for <strong>${title}</strong> has been received.</p>
        <p>It is now pending review by a verifier for <strong>${country}</strong>.</p>
        <p>Best,<br>WikiSourceVerifier Team</p>
      `;

      // Email B: Notify Verifier
      const verifierEmail = getVerifierEmail(country);
      const verifierHtml = `
        <h3>New Submission Pending Review</h3>
        <p>User <strong>${submitterName}</strong> submitted a new source for <strong>${country}</strong>.</p>
        <p>Please log in to verify.</p>
      `;

      // Send both emails (allSettled so one failure doesn't stop the other)
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
    const { country, category, status, search } = req.query;
    const { page, limit, offset } = paginate(req.query);

    const where = {};
    if (country) where.country = country;
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) Object.assign(where, searchAny(['title', 'publisher'], search));

    const result = await Submission.findAndCountAll({
      where,
      include: [includeSubmitter(['username', 'country']), includeVerifier(['username', 'country'])],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    listResponse(res, result, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Public
export const getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findByPk(req.params.id, {
      include: [
        includeSubmitter(['username', 'email', 'country', 'role', 'points', 'badges']),
        includeVerifier(['username', 'country', 'role'])
      ]
    });

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
    const { page, limit, offset } = paginate(req.query);

    const result = await Submission.findAndCountAll({
      where: { submitter: req.user.id },
      include: [includeVerifier(['username', 'country'])],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    listResponse(res, result, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Update submission (only by submitter before verification)
// @route   PUT /api/submissions/:id
// @access  Private
export const updateSubmission = async (req, res, next) => {
  try {
    let submission = await Submission.findByPk(req.params.id);

    if (!submission) {
      return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    // Check if user is the submitter
    if (String(submission.submitter) !== String(req.user.id)) {
      return next(new AppError('Not authorized to update this submission', 403, ErrorCodes.UNAUTHORIZED_ACCESS));
    }

    // Can't update if already verified
    if (submission.status !== 'pending') {
      return next(new AppError('Cannot update a verified submission', 400, ErrorCodes.SUBMISSION_LOCKED));
    }

    const { title, publisher, wikipediaArticle, category } = req.body;
    const updates = Object.fromEntries(
      Object.entries({ title, publisher, wikipediaArticle, category }).filter(([, v]) => v !== undefined)
    );

    await submission.update(updates);

    submission = await Submission.findByPk(submission.id, {
      include: [includeSubmitter(['username', 'country'])]
    });

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
    const submission = await Submission.findByPk(req.params.id);

    if (!submission) {
      return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    // Check if user is the submitter or admin
    if (String(submission.submitter) !== String(req.user.id) && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this submission', 403, ErrorCodes.UNAUTHORIZED_ACCESS));
    }

    await submission.destroy();

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

    let submission = await Submission.findByPk(req.params.id);

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
    submission.verifiedAt = new Date();

    await submission.save();

    if (status === 'approved') {
      const points = credibility === 'credible' ? 25 : 10;
      await User.increment({ points }, { where: { id: submission.submitter } });
    }

    await User.increment({ points: 5 }, { where: { id: req.user.id } });

    submission = await Submission.findByPk(submission.id, {
      include: [includeSubmitter(['username', 'country']), includeVerifier(['username', 'country'])]
    });

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
    const { page, limit, offset } = paginate(req.query);

    const where = { status: 'pending' };
    if (req.user.role !== 'admin') {
      where.country = req.user.country;
    }

    const result = await Submission.findAndCountAll({
      where,
      include: [includeSubmitter(['username', 'country'])],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    listResponse(res, result, page, limit);
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
    const where = country ? { country } : {};

    const [totals] = await Submission.findAll({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        countWhen('status', 'pending'),
        countWhen('status', 'approved'),
        countWhen('status', 'rejected'),
        countWhen('category', 'primary'),
        countWhen('category', 'secondary'),
        countWhen('category', 'unreliable')
      ],
      raw: true
    });

    const topCountries = await Submission.findAll({
      where,
      attributes: ['country', [fn('COUNT', col('id')), 'count']],
      group: ['country'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    const stats = Object.fromEntries(
      ['total', 'pending', 'approved', 'rejected', 'primary', 'secondary', 'unreliable']
        .map((key) => [key, Number(totals?.[key]) || 0])
    );

    res.status(200).json({
      success: true,
      stats,
      topCountries: topCountries.map(({ country: name, count }) => ({ _id: name, count: Number(count) }))
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Get Verifier Email based on Country
const getVerifierEmail = (country) => {
  const verifiers = {
    'Ghana': process.env.GHANA_VERIFIER_EMAIL,
    'Nigeria': process.env.NIGERIA_VERIFIER_EMAIL,
  };

  // Return specific verifier or fallback to Admin Email (or a default)
  return verifiers[country] || process.env.ADMIN_EMAIL || 'admin@wikisourceverifier.org';
};
