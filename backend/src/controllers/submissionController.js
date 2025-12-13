import Submission from '../models/Submission.js';
import User from '../models/User.js';

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private
export const createSubmission = async (req, res, next) => {
  try {
    console.log('📝 Create submission request:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null,
      contentType: req.get('content-type')
    });

    const { url, title, publisher, country, category, wikipediaArticle, fileType } = req.body;

    // Determine submission type based on file upload or URL
    const isPDFUpload = req.file || fileType === 'pdf';
    const submissionType = isPDFUpload ? 'pdf' : 'url';

    // Validate required fields based on submission type
    if (submissionType === 'url' && !url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required for URL submissions'
      });
    }

    if (submissionType === 'pdf' && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required for PDF submissions'
      });
    }

    // Build submission data
    const submissionData = {
      title,
      publisher,
      country,
      category,
      wikipediaArticle,
      fileType: submissionType,
      submitter: req.user.id
    };

    // Handle URL submission
    if (submissionType === 'url') {
      submissionData.url = url;
    } else {
      // Handle PDF file upload
      const filePath = req.file.path;
      const baseUrl = req.protocol + '://' + req.get('host');
      const fileUrl = `${baseUrl}/api/submissions/uploads/${req.file.filename}`;
      
      submissionData.url = fileUrl; // Store the URL to access the file
      submissionData.fileName = req.file.originalname;
      submissionData.fileMetadata = {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        filePath: filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };
    }

    const submission = await Submission.create(submissionData);

    // Award points to user
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: 10 }
    });

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('submitter', 'username country');

    res.status(201).json({
      success: true,
      submission: populatedSubmission
    });
  } catch (error) {
    console.error('❌ Error creating submission:', error);
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
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user is the submitter
    if (submission.submitter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this submission'
      });
    }

    // Can't update if already verified
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a verified submission'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user is the submitter or admin
    if (submission.submitter.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this submission'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been verified'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Credibility rating is required for approved submissions'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
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
