import { RequestHandler } from 'express';

export const jsonAuditLoggerMiddleware: RequestHandler = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (body): any {
    const duration = Date.now() - start;
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
    };

    console.log(JSON.stringify(log));
    return originalSend.call(this, body);
  };

  next();
};
