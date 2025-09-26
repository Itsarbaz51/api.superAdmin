import { Router } from "express";
import { verifyBank } from "../controllers/payout.controller.js";

const router = Router();

router.post("/add-with-verify", verifyBank);

export default router;
