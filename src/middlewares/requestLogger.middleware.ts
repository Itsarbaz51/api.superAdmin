import type { Request, Response, NextFunction } from "express";
import logger from "../utils/WinstonLogger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const forwarded = req.headers["x-forwarded-for"] as string | string[] | undefined;

    let ip: any;

    if (Array.isArray(forwarded)) {
      ip = forwarded[0] || req.ip;
    } else if (typeof forwarded === "string") {
      ip = forwarded.split(",")[0]?.trim() || req.ip;
    } else {
      ip = req.ip;
    }

    logger.info("Request completed", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip,
    });
  });

  next();
}
