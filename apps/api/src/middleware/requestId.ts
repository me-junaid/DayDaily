import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  next();
}
