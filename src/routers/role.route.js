import { Router } from "express";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import {
  createRole,
  getAllRoles,
  updateRole,
} from "../controllers/role.controller.js";

const router = Router();

router.post(
  "/create-role",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  createRole
);

router.put(
  "/update-role",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  updateRole
);

router.get(
  "/get-all-role",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  getAllRoles
);

router.delete(
  "/delete-role",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  getAllRoles
);

export default router;
