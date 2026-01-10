import { Request, Response, NextFunction } from "express";

export function jsonAuditLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const log = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    };
    console.log(JSON.stringify(log));
  });

  next();
}
