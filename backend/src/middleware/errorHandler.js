
import { ErrorCodes } from '../utils/errorCodes.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.errorCode = err.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR;

  // Log error with context
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    level: 'error',
    message: error.message,
    code: error.errorCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack
  };

  // In production, you might want to log to a file or external service
  if (process.env.NODE_ENV === 'development') {
    console.error(JSON.stringify(errorLog, null, 2));
  } else {
    console.error(JSON.stringify({ ...errorLog, stack: undefined }));
  }

  // Duplicate value on a unique column (username, email, countryCode)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'Value';
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      message,
      statusCode: 400,
      errorCode: ErrorCodes.RESOURCE_ALREADY_EXISTS
    };
  }

  // Model validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(val => val.message).join(', ');
    error = { 
      message, 
      statusCode: 400,
      errorCode: ErrorCodes.VALIDATION_ERROR
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { 
      message, 
      statusCode: 401,
      errorCode: ErrorCodes.TOKEN_INVALID
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { 
      message, 
      statusCode: 401,
      errorCode: ErrorCodes.TOKEN_EXPIRED
    };
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    errorCode: error.errorCode,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
