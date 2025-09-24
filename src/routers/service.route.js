import { Router } from "express";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import {
  assignServiceToUser,
  createService,
  deleteService,
  getServices,
  getUserServices,
  unassignServiceFromUser,
  updateService,
} from "../controllers/service.controller.js";

const router = Router();

router.post(
  "/create-service",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  createService
);

router.get(
  "/get-all-services",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  getServices
);

router.put(
  "/update-service",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  updateService
);

router.delete(
  "/delete-service/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  deleteService
);

// User <-> Service mapping
router.post(
  "/assign-service",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  assignServiceToUser
);

router.post(
  "/unassign-service",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  unassignServiceFromUser
);

router.get(
  "/get-assignded-user-services/:userId",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  getUserServices
);

export default router;
