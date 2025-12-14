/**
 * Socket.io service for emitting events
 * This service provides a centralized way to emit Socket.io events
 */

let io = null;

/**
 * Initialize the Socket.io instance
 * @param {Server} socketIO - The Socket.io server instance
 */
export const initializeSocketIO = (socketIO) => {
  io = socketIO;
};

/**
 * Get the Socket.io instance
 * @returns {Server} The Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocketIO first.');
  }
  return io;
};

/**
 * Emit a new submission event to relevant verifiers
 * @param {Object} submission - The submission object
 */
export const emitNewSubmission = (submission) => {
  if (!io) return;

  // Convert MongoDB _id to id for frontend compatibility
  const submissionId = submission._id ? submission._id.toString() : (submission.id ? submission.id.toString() : null);
  
  const submissionData = {
    id: submissionId,
    _id: submissionId, // Include both for compatibility
    title: submission.title,
    publisher: submission.publisher,
    country: submission.country,
    category: submission.category,
    url: submission.url,
    submitter: submission.submitter,
    createdAt: submission.createdAt,
    status: submission.status || 'pending'
  };

  // Emit to admins (all submissions)
  io.to('admin').emit('new-submission', {
    type: 'new-submission',
    submission: submissionData,
    message: `New submission: ${submission.title}`,
    timestamp: new Date().toISOString()
  });

  // Emit to verifiers for the specific country
  io.to(`country:${submission.country}`).emit('new-submission', {
    type: 'new-submission',
    submission: submissionData,
    message: `New submission from ${submission.country}: ${submission.title}`,
    timestamp: new Date().toISOString()
  });

  // Emit to all verifiers (for dashboard updates)
  io.to('verifiers').emit('submission-updated', {
    type: 'submission-updated',
    submission: submissionData,
    action: 'created',
    timestamp: new Date().toISOString()
  });

  // Also emit to admins for dashboard updates
  io.to('admin').emit('submission-updated', {
    type: 'submission-updated',
    submission: submissionData,
    action: 'created',
    timestamp: new Date().toISOString()
  });

  console.log(`Emitted new-submission event for submission: ${submission.title} to country:${submission.country}`);
};

/**
 * Emit a submission verification event
 * @param {Object} submission - The verified submission object
 */
export const emitSubmissionVerified = (submission) => {
  if (!io) return;

  // Convert MongoDB _id to id for frontend compatibility
  const submissionId = submission._id ? submission._id.toString() : (submission.id ? submission.id.toString() : null);
  
  const submissionData = {
    id: submissionId,
    _id: submissionId, // Include both for compatibility
    title: submission.title,
    publisher: submission.publisher,
    country: submission.country,
    category: submission.category,
    status: submission.status,
    credibility: submission.credibility,
    verifier: submission.verifier,
    verifiedAt: submission.verifiedAt,
    updatedAt: submission.updatedAt || submission.updatedAt
  };

  // Emit to admins
  io.to('admin').emit('submission-verified', {
    type: 'submission-verified',
    submission: submissionData,
    message: `Submission verified: ${submission.title}`
  });

  // Emit to verifiers
  io.to('verifiers').emit('submission-verified', {
    type: 'submission-verified',
    submission: submissionData,
    message: `Submission verified: ${submission.title}`
  });

  // Emit to the submitter
  if (submission.submitter && submission.submitter._id) {
    io.to(`user:${submission.submitter._id}`).emit('submission-verified', {
      type: 'submission-verified',
      submission: submissionData,
      message: `Your submission "${submission.title}" has been ${submission.status}`
    });
  }

  // Emit dashboard update event
  io.to('admin').emit('submission-updated', {
    type: 'submission-updated',
    submission: submissionData,
    action: 'verified'
  });

  io.to('verifiers').emit('submission-updated', {
    type: 'submission-updated',
    submission: submissionData,
    action: 'verified'
  });

  console.log(`Emitted submission-verified event for submission: ${submission.title}`);
};

/**
 * Emit dashboard stats update
 * @param {Object} stats - Statistics object
 */
export const emitDashboardStats = (stats) => {
  if (!io) return;

  io.to('admin').emit('dashboard-stats', {
    type: 'dashboard-stats',
    stats
  });

  io.to('verifiers').emit('dashboard-stats', {
    type: 'dashboard-stats',
    stats
  });
};

