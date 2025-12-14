import { body, validationResult } from 'express-validator';


import { ErrorCodes } from '../utils/errorCodes.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errorCode: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      })),
      requestId: req.requestId
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
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
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
