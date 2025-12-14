import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
];

export const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const submissionValidation = [
  body('fileType')
    .optional()
    .isIn(['url', 'pdf'])
    .withMessage('File type must be url or pdf'),
  body('url')
    .trim()
    .custom((value, { req }) => {
      const fileType = req.body.fileType || 'url';
      // For URL submissions, URL is required and must be valid
      if (fileType === 'url') {
        if (!value || value.trim() === '') {
          throw new Error('URL is required for URL submissions');
        }
        // Basic URL validation
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Please provide a valid URL');
        }
      }
      // For PDF submissions, URL is optional (can be a placeholder)
      return true;
    }),
  body('fileName')
    .trim()
    .custom((value, { req }) => {
      const fileType = req.body.fileType || 'url';
      // For PDF submissions, fileName is required
      if (fileType === 'pdf') {
        if (!value || value.trim() === '') {
          throw new Error('File name is required for PDF submissions');
        }
      }
      return true;
    })
    .optional(),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('publisher')
    .trim()
    .notEmpty()
    .withMessage('Publisher is required')
    .isLength({ max: 100 })
    .withMessage('Publisher cannot exceed 100 characters'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('category')
    .isIn(['primary', 'secondary', 'unreliable'])
    .withMessage('Category must be primary, secondary, or unreliable')
];

export const verificationValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
  body('verifierNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];
