import { Router } from "express";
import RoleController from "../controllers/role.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import RoleValidationSchemas from "../validations/roleValidation.schemas.js";

const roleRoutes = Router();

roleRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  RoleController.index
);

roleRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  RoleController.show
);

roleRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(RoleValidationSchemas.store),
  RoleController.store
);

roleRoutes.put(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(RoleValidationSchemas.update),
  RoleController.update
);

roleRoutes.patch(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(RoleValidationSchemas.update.partial()),
  RoleController.update
);

roleRoutes.delete(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  RoleController.destroy
);

export default roleRoutes;
