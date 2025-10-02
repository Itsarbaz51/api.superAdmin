import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { StaticRoutes } from "./routers/staticRoutes.js";
import { requestId } from "./middlewares/requestId.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter.middleware.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = ["http://localhost:5173"];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(helmet());
app.use(requestId);
app.use(requestLogger);
app.use(rateLimiterMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok", requestId: req.requestId });
});

StaticRoutes(app);

export default app;
