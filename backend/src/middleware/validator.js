import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: errors.array()[0]?.msg || 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
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
  body('url')
    .optional({ checkFalsy: true, values: 'falsy' })
    .customSanitizer((value) => value ? String(value).trim() : value)
    .custom((value, { req }) => {
      // URL is required for URL submissions, optional for PDF submissions
      const fileType = req.body?.fileType || (req.file ? 'pdf' : 'url');
      if (fileType === 'url' && !value) {
        throw new Error('URL is required for URL submissions');
      }
      if (value && typeof value === 'string' && !/^https?:\/\/.+/.test(value)) {
        throw new Error('Please provide a valid URL');
      }
      return true;
    }),
  body('title')
    .customSanitizer((value) => value ? String(value).trim() : value)
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('publisher')
    .customSanitizer((value) => value ? String(value).trim() : value)
    .notEmpty()
    .withMessage('Publisher is required')
    .isLength({ max: 100 })
    .withMessage('Publisher cannot exceed 100 characters'),
  body('country')
    .customSanitizer((value) => value ? String(value).trim() : value)
    .notEmpty()
    .withMessage('Country is required'),
  body('category')
    .customSanitizer((value) => value ? String(value).trim() : value)
    .isIn(['primary', 'secondary', 'unreliable'])
    .withMessage('Category must be primary, secondary, or unreliable'),
  body('fileType')
    .optional({ checkFalsy: true })
    .customSanitizer((value) => value ? String(value).trim() : value)
    .isIn(['url', 'pdf'])
    .withMessage('File type must be url or pdf'),
  body('wikipediaArticle')
    .optional({ checkFalsy: true })
    .customSanitizer((value) => value ? String(value).trim() : value)
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
