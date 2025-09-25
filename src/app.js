import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import registerRoutes from "./routers/registerRoutes.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = ["http://localhost:5173"];
      if (!origin || !allowed.includes(origin)) {
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

registerRoutes(app);
app.get("/", (req, res) => {
  res.send("Hello from fintech!");
});

export default app;
