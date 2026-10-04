import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err, 'Unhandled error');
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
}
