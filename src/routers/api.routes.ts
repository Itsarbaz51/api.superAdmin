import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import ApiKeyController from "../controllers/api.controller.js";
import ApiKeyValidationSchemas from "../validations/apiValidation.schemas.js";

const apiKeyRoutes = Router();

// List all API keys for a user
apiKeyRoutes.get(
  "/list",
  AuthMiddleware.isAuthenticated,
  ApiKeyController.index
);

// Show a single API key by ID
// apiKeyRoutes.get(
//   "/show/:id",
//   AuthMiddleware.isAuthenticated,
//   ApiKeyController.show
// );

// Create a new API key
apiKeyRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  validateRequest(ApiKeyValidationSchemas.CreateApiKey), // ✅ fixed schema
  ApiKeyController.create
);

// Update an existing API key
// apiKeyRoutes.put(
//   "/update/:id",
//   AuthMiddleware.isAuthenticated,
//   validateRequest(ApiKeyValidationSchemas.UpdateApiKey), // make sure this exists in your schema
//   ApiKeyController.update
// );

// Deactivate an API key
apiKeyRoutes.put(
  "/deactivate/:id",
  AuthMiddleware.isAuthenticated,
  ApiKeyController.deactivate
);

// Delete an API key
apiKeyRoutes.delete(
  "/delete/:id",
  AuthMiddleware.isAuthenticated,
  ApiKeyController.delete
);

// Add Service to API Key
apiKeyRoutes.post(
  "/service/add",
  AuthMiddleware.isAuthenticated,
  validateRequest(ApiKeyValidationSchemas.AddService),
  ApiKeyController.addService
);

// Add IP to Whitelist
apiKeyRoutes.post(
  "/ip-whitelist/add",
  AuthMiddleware.isAuthenticated,
  validateRequest(ApiKeyValidationSchemas.AddIpWhitelist),
  ApiKeyController.addIpWhitelist
);

export default apiKeyRoutes;
