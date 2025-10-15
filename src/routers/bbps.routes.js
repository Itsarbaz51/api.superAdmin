// src/routes/bbps.routes.ts
import { Router } from "express";
import { BBPSController } from "../controllers/bbps.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";

const bbpsRoutes = Router();

// Apply auth middleware to all routes
bbpsRoutes.use(authMiddleware);

// BBPS Biller APIs
bbpsRoutes.get("/billers", BBPSController.getBillers);
bbpsRoutes.post("/billers/fetch", BBPSController.fetchBill);
bbpsRoutes.post("/billers/validate", BBPSController.validateBill);
bbpsRoutes.get("/billers/:billerId/plans", BBPSController.pullPlans);

// BBPS Transaction APIs
bbpsRoutes.post("/pay", idempotencyMiddleware, BBPSController.payBill);
bbpsRoutes.get("/transaction/status", BBPSController.getTransactionStatus);

// BBPS Complaint APIs
bbpsRoutes.post("/complaint", BBPSController.registerComplaint);
bbpsRoutes.get("/complaint/:complaintId/track", BBPSController.trackComplaint);

export default bbpsRoutes;
