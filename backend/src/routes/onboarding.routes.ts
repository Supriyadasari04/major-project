import { Router } from "express";
import {
  addGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  addHabit,
  getHabits,
  completeHabit,
  uncompleteHabit,
  deleteHabit,
  setOnboardingComplete,
  getOnboardingStatus,
  addTask,
  getTasksByDate,
  toggleTask,
  deleteTask,
  getSettings,
  updateSettings,
  addReflection,
  getReflections,
  addJournalEntry,
  getJournalEntries,
  getAchievements,
  unlockAchievement,
  updateJournalEntry,
  deleteJournalEntry,
} from "../controllers/onboarding.controller";

const router = Router();

router.post("/goals", addGoal);
router.get("/goals/:userId", getGoals);
router.put("/goals/:goalId", updateGoal);
router.delete("/goals/:goalId", deleteGoal);


router.post("/habits", addHabit);
router.get("/habits/:userId", getHabits);
router.post("/habits/:habitId/complete", completeHabit);
router.post("/habits/:habitId/uncomplete", uncompleteHabit);
router.delete("/habits/:habitId", deleteHabit);

router.post("/tasks", addTask);
router.get("/tasks/:userId/:date", getTasksByDate);
router.patch("/tasks/:taskId/toggle", toggleTask);
router.delete("/tasks/:taskId", deleteTask);

router.get("/settings/:userId", getSettings);
router.put("/settings/:userId", updateSettings);

router.post("/reflections", addReflection);
router.get("/reflections/:userId", getReflections);

router.post("/journal", addJournalEntry);
router.get("/journal/:userId", getJournalEntries);
router.put("/journal/:journalId", updateJournalEntry);
router.delete("/journal/:journalId", deleteJournalEntry);

router.get("/achievements/:userId", getAchievements);
router.patch("/achievements/:userId/:achievementId/unlock", unlockAchievement);


router.post("/complete", setOnboardingComplete);
router.get("/status/:userId", getOnboardingStatus);

export default router;
