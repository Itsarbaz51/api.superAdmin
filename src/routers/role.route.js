import { Router } from "express";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import {
  createRole,
  deleteRole,
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
  "/update-role/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  updateRole
);

router.get(
  "/get-all-role",
  isAuthenticated,
  authorizeRoles([
    "SUPER_ADMIN",
    "ADMIN",
    "STATE_HEAD",
    "MASTER_DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  getAllRoles
);

router.delete(
  "/delete-role/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  deleteRole
);

export default router;
