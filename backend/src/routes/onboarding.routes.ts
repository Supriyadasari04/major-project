// import { Router } from "express";
// import {
//   addGoal,
//   getGoals,
//   addHabit,
//   getHabits,
//   setOnboardingComplete,
//   getOnboardingStatus,
//   completeHabit,
//   uncompleteHabit,
//   deleteHabit,
//   deleteGoal,
// } from "../controllers/onboarding.controller";

// const router = Router();

// // Goals
// router.post("/goals", addGoal);
// router.get("/goals/:userId", getGoals);
// router.delete("/goals/:goalId", deleteGoal);

// // Habits
// router.post("/habits", addHabit);
// router.get("/habits/:userId", getHabits);
// router.post("/habits/:habitId/complete", completeHabit);
// router.post("/habits/:habitId/uncomplete", uncompleteHabit);
// router.delete("/habits/:habitId", deleteHabit);

// // Onboarding
// router.post("/complete", setOnboardingComplete);
// router.get("/status/:userId", getOnboardingStatus);

// export default router;












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
  unlockAchievement
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

// ✅ TASKS
router.post("/tasks", addTask);
router.get("/tasks/:userId/:date", getTasksByDate);
router.patch("/tasks/:taskId/toggle", toggleTask);
router.delete("/tasks/:taskId", deleteTask);

// ✅ SETTINGS
router.get("/settings/:userId", getSettings);
router.put("/settings/:userId", updateSettings);

// ✅ REFLECTIONS
router.post("/reflections", addReflection);
router.get("/reflections/:userId", getReflections);

// ✅ JOURNAL
router.post("/journal", addJournalEntry);
router.get("/journal/:userId", getJournalEntries);

router.get("/achievements/:userId", getAchievements);
router.patch("/achievements/:achievementId/unlock", unlockAchievement);

router.post("/complete", setOnboardingComplete);
router.get("/status/:userId", getOnboardingStatus);

export default router;
