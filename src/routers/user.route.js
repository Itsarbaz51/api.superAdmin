import { Router } from "express";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import {
  createUser,
  deleteUserById,
  getAllUsers,
  getUserById,
  updateStatus,
  updateUserById,
} from "../controllers/user.controller.js";

const router = Router();

router.post(
  "/create-user",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  createUser
);
router.get(
  "/get-all-user",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  getAllUsers
);
router.get(
  "/get-user-id/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  getUserById
);
router.put(
  "/update-user/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  updateUserById
);
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  deleteUserById
);
router.put(
  "/update-status/:id",
  isAuthenticated,
  authorizeRoles(["SUPER_ADMIN"]),
  updateStatus
);

export default router;
