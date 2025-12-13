import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${sanitizedBaseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow PDF files
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware for single PDF file upload (optional - allows no file for URL submissions)
export const uploadPDF = (req, res, next) => {
  console.log('📤 Upload middleware - Content-Type:', req.get('content-type'));
  
  upload.single('pdfFile')(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err.code, err.message);
      // If no file is provided, that's OK for URL submissions
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        console.log('⚠️ No file provided - continuing (OK for URL submissions)');
        return next();
      }
      // For other errors, pass to error handler
      return next(err);
    }
    console.log('✅ Upload middleware - File:', req.file ? req.file.originalname : 'No file');
    next();
  });
};

// Error handler for multer errors
export const handleUploadError = (err, req, res, next) => {
  // If no error, continue to next middleware
  if (!err) {
    return next();
  }

  // Handle multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }
    // For other multer errors, only fail if a file was actually being uploaded
    // If no file field was provided (for URL submissions), ignore the error
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
      // These errors occur when unexpected files are sent, but we allow no file for URL submissions
      return next(); // Continue - the controller will validate if file is needed
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  // Handle other upload errors (like file filter rejections)
  if (err.message && err.message.includes('Only PDF files are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // For other errors, pass to next error handler
  next(err);
};

