import { Parser } from 'json2csv';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

class ExportUtils {
  // Transform submission data for export
  static transformSubmissionData(submissions) {
    return submissions.map(submission => ({
      id: submission._id,
      url: submission.url,
      title: submission.title,
      publisher: submission.publisher,
      country: submission.country,
      category: submission.category,
      status: submission.status,
      credibility: submission.credibility || 'N/A',
      submitter: submission.submitter?.username || 'N/A',
      submitterEmail: submission.submitter?.email || 'N/A',
      submitterCountry: submission.submitter?.country || 'N/A',
      verifier: submission.verifier?.username || 'N/A',
      verifierEmail: submission.verifier?.email || 'N/A',
      wikipediaArticle: submission.wikipediaArticle || 'N/A',
      verifierNotes: submission.verifierNotes || 'N/A',
      fileType: submission.fileType,
      fileName: submission.fileName || 'N/A',
      tags: submission.tags?.join(', ') || 'N/A',
      createdAt: submission.createdAt?.toISOString() || 'N/A',
      verifiedAt: submission.verifiedAt?.toISOString() || 'N/A',
      updatedAt: submission.updatedAt?.toISOString() || 'N/A'
    }));
  }

  // Build filter query based on parameters
  static buildFilterQuery(filters) {
    const query = {};

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }

    // Country filter
    if (filters.country && filters.country !== 'all') {
      query.country = filters.country;
    }

    // Submitter filter
    if (filters.submitter) {
      query.submitter = filters.submitter;
    }

    // Verifier filter
    if (filters.verifier) {
      query.verifier = filters.verifier;
    }

    // Date range filters
    if (filters.createdFrom || filters.createdTo) {
      query.createdAt = {};
      if (filters.createdFrom) {
        query.createdAt.$gte = new Date(filters.createdFrom);
      }
      if (filters.createdTo) {
        query.createdAt.$lte = new Date(filters.createdTo);
      }
    }

    if (filters.verifiedFrom || filters.verifiedTo) {
      query.verifiedAt = {};
      if (filters.verifiedFrom) {
        query.verifiedAt.$gte = new Date(filters.verifiedFrom);
      }
      if (filters.verifiedTo) {
        query.verifiedAt.$lte = new Date(filters.verifiedTo);
      }
    }

    // Search filter
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { publisher: { $regex: filters.search, $options: 'i' } },
        { url: { $regex: filters.search, $options: 'i' } },
        { wikipediaArticle: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return query;
  }

  // Get available countries for filter dropdown
  static async getAvailableCountries() {
    try {
      const countries = await Submission.distinct('country');
      return countries.sort();
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  // Get available submitters for filter dropdown
  static async getAvailableSubmitters() {
    try {
      const submitters = await Submission.distinct('submitter');
      const submitterDetails = await User.find({ _id: { $in: submitters } })
        .select('username email')
        .lean();
      
      return submitterDetails.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email
      }));
    } catch (error) {
      console.error('Error fetching submitters:', error);
      return [];
    }
  }

  // Get available verifiers for filter dropdown
  static async getAvailableVerifiers() {
    try {
      const verifiers = await Submission.distinct('verifier');
      const verifierDetails = await User.find({ _id: { $in: verifiers } })
        .select('username email')
        .lean();
      
      return verifierDetails.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email
      }));
    } catch (error) {
      console.error('Error fetching verifiers:', error);
      return [];
    }
  }

  // Convert data to CSV format
  static async convertToCSV(data, fields = null) {
    try {
      const defaultFields = [
        'id', 'url', 'title', 'publisher', 'country', 'category',
        'status', 'credibility', 'submitter', 'submitterEmail',
        'verifier', 'verifierEmail', 'createdAt', 'verifiedAt'
      ];

      const csvFields = fields || defaultFields;
      
      const parser = new Parser({ fields: csvFields });
      const csv = parser.parse(data);
      
      return csv;
    } catch (error) {
      console.error('CSV conversion error:', error);
      throw new Error('Failed to convert data to CSV');
    }
  }

  // Get export statistics
  static async getExportStats(filters) {
    try {
      const query = this.buildFilterQuery(filters);
      
      const stats = await Submission.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            primaryCount: {
              $sum: { $cond: [{ $eq: ['$category', 'primary'] }, 1, 0] }
            },
            secondaryCount: {
              $sum: { $cond: [{ $eq: ['$category', 'secondary'] }, 1, 0] }
            },
            unreliableCount: {
              $sum: { $cond: [{ $eq: ['$category', 'unreliable'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalCount: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        primaryCount: 0,
        secondaryCount: 0,
        unreliableCount: 0
      };
    } catch (error) {
      console.error('Error fetching export stats:', error);
      return {
        totalCount: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        primaryCount: 0,
        secondaryCount: 0,
        unreliableCount: 0
      };
    }
  }

  // Validate batch operation data
  static validateBatchOperation(submissionIds, operation) {
    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      throw new Error('Submission IDs array is required');
    }

    if (submissionIds.length > 1000) {
      throw new Error('Batch operation cannot process more than 1000 submissions at once');
    }

    const validOperations = ['approve', 'reject', 'delete', 'updateStatus'];
    if (!validOperations.includes(operation)) {
      throw new Error('Invalid batch operation');
    }

    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    for (const id of submissionIds) {
      if (!objectIdRegex.test(id)) {
        throw new Error(`Invalid submission ID format: ${id}`);
      }
    }

    return true;
  }

  // Log batch operation for audit trail
  static async logBatchOperation(adminId, operation, submissionIds, details = {}) {
    try {
      console.log(`[AUDIT] Batch ${operation} operation by admin ${adminId}:`, {
        submissionCount: submissionIds.length,
        submissionIds: submissionIds.slice(0, 10), // Log first 10 IDs
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging batch operation:', error);
    }
  }
}

export default ExportUtils;
