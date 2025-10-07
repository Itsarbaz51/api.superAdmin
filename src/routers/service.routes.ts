import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import ServiceController from "../controllers/service.controller.js";
import ServiceValidationSchemas from "../validations/serviceValidation.schemas.js";

const serviceRoutes = Router();

serviceRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.create),
  ServiceController.create
);

serviceRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceController.getAll
);

serviceRoutes.get(
  "/service/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.create),
  ServiceController.getById
);

serviceRoutes.put(
  "/update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.update),
  ServiceController.update
);

serviceRoutes.put(
  "/deactivate/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceController.deactivate
);

export default serviceRoutes;
