import { RequestHandler } from 'express';
import { randomUUID } from 'crypto';

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = randomUUID().split('-')[0];
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
