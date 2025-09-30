import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const routers = Router();

routers.get("/test", AuthController.index);

export default routers;
