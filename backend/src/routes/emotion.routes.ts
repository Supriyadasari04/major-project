import { Router } from "express";
import {
  analyzeEmotionAndSave,
  getMoodLogsByMonth,
} from "../controllers/emotion.controller";

const router = Router();

// ✅ Analyze + Save mood log
router.post("/analyze", analyzeEmotionAndSave);

// ✅ Get mood logs filtered by month/year
router.get("/logs/:userId/month", getMoodLogsByMonth);

export default router;
