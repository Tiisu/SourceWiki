import ERROR_CODES from './errorCodes.js';

class AppError extends Error {
  constructor(
    message,
    statusCode,
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    isOperational = true
  ) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace?.(this, AppError);
  }
}

export default AppError;
