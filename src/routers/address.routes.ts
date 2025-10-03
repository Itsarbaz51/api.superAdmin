import { Router } from "express";
import { StateController } from "../controllers/address.controller.js";

const addressRoutes = Router();

// address
// addressRoutes.get("");
// addressRoutes.post(
//   "address-store",
//   AuthMiddleware.isAuthenticated,
//   addressController.AddressController.store
// );
// addressRoutes.put("");
// addressRoutes.delete("");

// state
// addressRoutes.get("");
addressRoutes.post("/state-store", StateController.store);
// addressRoutes.put("");
// addressRoutes.delete("");

// city
// addressRoutes.get("");
// addressRoutes.post("city-store");
// addressRoutes.put("");
// addressRoutes.delete("");

export default addressRoutes;
