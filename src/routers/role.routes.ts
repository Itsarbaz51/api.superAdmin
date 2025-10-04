import { Router } from "express";
import RoleController from "../controllers/role.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import RoleValidationSchemas from "../validations/roleValidation.schemas.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const roleRoutes = Router();

// roleRoutes.get("");
roleRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(RoleValidationSchemas.store),
  RoleController.store
);
// roleRoutes.delete("");

export default roleRoutes;
