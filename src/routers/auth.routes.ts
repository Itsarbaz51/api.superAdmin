import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const authRoutes = Router();

// authRoutes.get("");
authRoutes.post("/register", AuthController.register);
// authRoutes.put("");
// authRoutes.delete("");

export default authRoutes;
