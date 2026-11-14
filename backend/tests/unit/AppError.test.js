import AppError from '../../src/utils/AppError.js';
import { ErrorCodes, ErrorMessages } from '../../src/utils/errorCodes.js';

describe('AppError', () => {
  describe('Constructor and properties', () => {
    it('should correctly set message, statusCode, and errorCode', () => {
      const error = new AppError('Resource not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe(ErrorCodes.RESOURCE_NOT_FOUND);
    });

    it('should set isOperational to true', () => {
      const error = new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);

      expect(error.isOperational).toBe(true);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Validation error', 400, ErrorCodes.VALIDATION_ERROR);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('Error');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Server error', 500, ErrorCodes.INTERNAL_SERVER_ERROR);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('Status derivation', () => {
    it("should set status to 'fail' for 4xx client errors", () => {
      const err400 = new AppError('Bad request', 400, ErrorCodes.INVALID_INPUT);
      const err401 = new AppError('Unauthorized', 401, ErrorCodes.AUTHENTICATION_FAILED);
      const err403 = new AppError('Forbidden', 403, ErrorCodes.UNAUTHORIZED_ACCESS);
      const err404 = new AppError('Not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
      const err429 = new AppError('Rate limit', 429, ErrorCodes.RATE_LIMIT_EXCEEDED);

      expect(err400.status).toBe('fail');
      expect(err401.status).toBe('fail');
      expect(err403.status).toBe('fail');
      expect(err404.status).toBe('fail');
      expect(err429.status).toBe('fail');
    });

    it("should set status to 'error' for 5xx server errors", () => {
      const err500 = new AppError('Internal error', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
      const err503 = new AppError('Service unavailable', 503, ErrorCodes.SERVICE_UNAVAILABLE);

      expect(err500.status).toBe('error');
      expect(err503.status).toBe('error');
    });
  });

  describe('ErrorCodes and ErrorMessages', () => {
    it('should define authentication error codes', () => {
      expect(ErrorCodes.AUTHENTICATION_FAILED).toBe('AUTHENTICATION_FAILED');
      expect(ErrorCodes.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
      expect(ErrorCodes.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
      expect(ErrorCodes.TOKEN_INVALID).toBe('TOKEN_INVALID');
      expect(ErrorCodes.ACCOUNT_LOCKED).toBe('ACCOUNT_LOCKED');
      expect(ErrorCodes.ACCOUNT_INACTIVE).toBe('ACCOUNT_INACTIVE');
      expect(ErrorCodes.UNAUTHORIZED_ACCESS).toBe('UNAUTHORIZED_ACCESS');
    });

    it('should define resource and input error codes', () => {
      expect(ErrorCodes.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
      expect(ErrorCodes.RESOURCE_ALREADY_EXISTS).toBe('RESOURCE_ALREADY_EXISTS');
      expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });

    it('should define system and business logic error codes', () => {
      expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
      expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes.OPERATION_NOT_ALLOWED).toBe('OPERATION_NOT_ALLOWED');
      expect(ErrorCodes.SUBMISSION_LOCKED).toBe('SUBMISSION_LOCKED');
    });

    it('should provide default messages for known error codes in ErrorMessages', () => {
      expect(ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR]).toBe('An unexpected error occurred');
      expect(ErrorMessages[ErrorCodes.RESOURCE_NOT_FOUND]).toBe('The requested resource was not found');
      expect(ErrorMessages[ErrorCodes.UNAUTHORIZED_ACCESS]).toBe(
        'You do not have permission to perform this action'
      );
    });

    it('should construct AppError using ErrorCodes and ErrorMessages together', () => {
      const code = ErrorCodes.RESOURCE_NOT_FOUND;
      const message = ErrorMessages[code];
      const error = new AppError(message, 404, code);

      expect(error.message).toBe('The requested resource was not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });
  });
});
