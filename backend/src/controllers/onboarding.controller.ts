import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

export const addGoal = async (req: any, res: any) => {
  try {
    const { userId, title, description, category } = req.body;

    if (!userId || !title || !category) {
      return res.status(400).json({ message: "userId, title, category are required" });
    }

    const result = await pool.query(
      `INSERT INTO goals (id, user_id, title, description, category, progress, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [uuid(), userId, title, description ?? null, category, 0, new Date()]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ADD GOAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to add goal" });
  }
};


export const getGoals = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("GET GOALS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

export const updateGoal = async (req: any, res: any) => {
  try {
    const { goalId } = req.params;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE goals
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           progress = COALESCE($4, progress)
       WHERE id = $5
       RETURNING *`,
      [updates.title ?? null, updates.description ?? null, updates.category ?? null, updates.progress ?? null, goalId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Goal not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("UPDATE GOAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to update goal" });
  }
};

export const deleteGoal = async (req: any, res: any) => {
  try {
    const { goalId } = req.params;

    const result = await pool.query("DELETE FROM goals WHERE id = $1 RETURNING *", [goalId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Goal not found" });

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE GOAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete goal" });
  }
};


export const addHabit = async (req: any, res: any) => {
  console.log("ADD HABIT HIT", req.body);
  const { userId, title, description, category, frequency } = req.body;

  const result = await pool.query(
    `INSERT INTO habits (id, user_id, title, description, category, frequency, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [uuid(), userId, title, description, category, frequency, new Date()]
  );

  res.json(result.rows[0]);
};

export const getHabits = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("GET HABITS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch habits" });
  }
};
export const completeHabit = async (req: any, res: any) => {
  try {
    const { habitId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `
      UPDATE habits
      SET
        completed_dates =
          CASE
            WHEN NOT ($1 = ANY(COALESCE(completed_dates, '{}')))
            THEN array_append(COALESCE(completed_dates, '{}'), $1)
            ELSE COALESCE(completed_dates, '{}')
          END,

        streak =
          CASE
            WHEN $1 = ANY(COALESCE(completed_dates, '{}')) THEN streak
            WHEN last_completed_date = ($1::date - INTERVAL '1 day')::date THEN COALESCE(streak, 0) + 1
            ELSE 1
          END,

        last_completed_date =
          CASE
            WHEN $1 = ANY(COALESCE(completed_dates, '{}')) THEN last_completed_date
            ELSE $1::date
          END

      WHERE id = $2
      RETURNING *;
      `,
      [today, habitId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Habit not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("COMPLETE HABIT ERROR:", error.message);
    res.status(500).json({ message: "Failed to complete habit" });
  }
};

export const uncompleteHabit = async (req: any, res: any) => {
  try {
    const { habitId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `
      UPDATE habits
      SET
        completed_dates = array_remove(COALESCE(completed_dates, '{}'), $1),
        streak =
          CASE
            WHEN last_completed_date = $1::date THEN 0
            ELSE streak
          END,
        last_completed_date =
          CASE
            WHEN last_completed_date = $1::date THEN NULL
            ELSE last_completed_date
          END
      WHERE id = $2
      RETURNING *;
      `,
      [today, habitId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Habit not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("UNCOMPLETE HABIT ERROR:", error.message);
    res.status(500).json({ message: "Failed to uncomplete habit" });
  }
};


export const deleteHabit = async (req: any, res: any) => {
  try {
    const { habitId } = req.params;

    const result = await pool.query("DELETE FROM habits WHERE id = $1 RETURNING *", [habitId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Habit not found" });

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE HABIT ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete habit" });
  }
};


export const setOnboardingComplete = async (req: any, res: any) => {
  try {
    const { userId } = req.body;

    await pool.query("UPDATE users SET onboarding_complete = true WHERE id = $1", [userId]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("SET ONBOARDING COMPLETE ERROR:", error.message);
    res.status(500).json({ message: "Failed to set onboarding complete" });
  }
};

export const getOnboardingStatus = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const result = await pool.query("SELECT onboarding_complete FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) return res.json({ completed: false });

    res.json({ completed: result.rows[0].onboarding_complete ?? false });
  } catch (error: any) {
    console.error("GET ONBOARDING STATUS ERROR:", error.message);
    res.status(500).json({ message: "Failed to get onboarding status" });
  }
};


export const addTask = async (req: any, res: any) => {
  try {
    const { userId, title, description, completed, date, habitId, goalId, priority } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (id, user_id, title, description, completed, date, habit_id, goal_id, priority, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        uuid(),
        userId,
        title,
        description ?? null,
        completed ?? false,
        date,
        habitId ?? null,
        goalId ?? null,
        priority ?? "medium",
        new Date(),
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ADD TASK ERROR:", error.message);
      }
};

export const getTasksByDate = async (req: any, res: any) => {
  try {
    const { userId, date } = req.params;

    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 AND date = $2 ORDER BY created_at ASC",
      [userId, date]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET TASKS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

export const toggleTask = async (req: any, res: any) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      `UPDATE tasks SET completed = NOT completed WHERE id = $1 RETURNING *`,
      [taskId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Task not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("TOGGLE TASK ERROR:", error.message);
    res.status(500).json({ message: "Failed to toggle task" });
  }
};

export const deleteTask = async (req: any, res: any) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [taskId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Task not found" });

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE TASK ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

export const getSettings = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM settings WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    if (result.rowCount === 0) {
      // Return frontend-compatible default object
      return res.json({
        notifications: true,
        morningPrepTime: "07:00",
        eveningReflectionTime: "21:00",
        theme: "light",
        privacy: { shareAnalytics: false, showStreak: true },
        morningPrepCount: 0,

        // ✅ New defaults
        emotionTrackingEnabled: true,
        emotionTrackingDisabledAt: null,
        emotionTrackingLastReminderAt: null,
      });
    }

    const row = result.rows[0];

    // ✅ Convert DB row -> frontend shape
    return res.json({
      notifications: row.notifications ?? true,
      morningPrepTime: row.morning_prep_time ?? "07:00",
      eveningReflectionTime: row.evening_reflection_time ?? "21:00",
      theme: row.theme ?? "light",
      privacy: {
        shareAnalytics: row.share_analytics ?? false,
        showStreak: row.show_streak ?? true,
      },
      morningPrepCount: row.morning_prep_count ?? 0,

      // ✅ New fields
      emotionTrackingEnabled: row.emotion_tracking_enabled ?? true,
      emotionTrackingDisabledAt: row.emotion_tracking_disabled_at ?? null,
      emotionTrackingLastReminderAt: row.emotion_tracking_last_reminder_at ?? null,
    });
  } catch (error: any) {
    console.error("GET SETTINGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};



export const updateSettings = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const s = req.body;

    const enabled =
      s.emotionTrackingEnabled === undefined ? true : Boolean(s.emotionTrackingEnabled);

    const disabledAt = s.emotionTrackingDisabledAt ?? null;
    const lastReminderAt = s.emotionTrackingLastReminderAt ?? null;

    const result = await pool.query(
      `
      INSERT INTO settings (
        id,
        user_id,
        notifications,
        morning_prep_time,
        evening_reflection_time,
        theme,
        share_analytics,
        show_streak,
        created_at,
        updated_at,
        morning_prep_count,

        emotion_tracking_enabled,
        emotion_tracking_disabled_at,
        emotion_tracking_last_reminder_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        $12,$13,$14
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        notifications = EXCLUDED.notifications,
        morning_prep_time = EXCLUDED.morning_prep_time,
        evening_reflection_time = EXCLUDED.evening_reflection_time,
        theme = EXCLUDED.theme,
        share_analytics = EXCLUDED.share_analytics,
        show_streak = EXCLUDED.show_streak,
        updated_at = EXCLUDED.updated_at,
        morning_prep_count = EXCLUDED.morning_prep_count,

        emotion_tracking_enabled = EXCLUDED.emotion_tracking_enabled,
        emotion_tracking_disabled_at = EXCLUDED.emotion_tracking_disabled_at,
        emotion_tracking_last_reminder_at = EXCLUDED.emotion_tracking_last_reminder_at
      RETURNING *;
      `,
      [
        uuid(),
        userId,
        s.notifications ?? true,
        s.morningPrepTime ?? "07:00",
        s.eveningReflectionTime ?? "21:00",
        s.theme ?? "light",
        s.privacy?.shareAnalytics ?? false,
        s.privacy?.showStreak ?? true,
        new Date(),
        new Date(),
        s.morningPrepCount ?? 0,

        enabled,
        disabledAt,
        lastReminderAt,
      ]
    );

    const row = result.rows[0];

    // ✅ Return frontend-compatible shape
    res.json({
      notifications: row.notifications ?? true,
      morningPrepTime: row.morning_prep_time ?? "07:00",
      eveningReflectionTime: row.evening_reflection_time ?? "21:00",
      theme: row.theme ?? "light",
      privacy: {
        shareAnalytics: row.share_analytics ?? false,
        showStreak: row.show_streak ?? true,
      },
      morningPrepCount: row.morning_prep_count ?? 0,

      emotionTrackingEnabled: row.emotion_tracking_enabled ?? true,
      emotionTrackingDisabledAt: row.emotion_tracking_disabled_at ?? null,
      emotionTrackingLastReminderAt: row.emotion_tracking_last_reminder_at ?? null,
    });
  } catch (error: any) {
    console.error("UPDATE SETTINGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to update settings" });
  }
};



import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

// ============================
// ✅ JOURNAL ENTRIES (DB)
// ============================
export const addJournalEntry = async (req: any, res: any) => {
  try {
    const {
      userId,
      date,
      content,
      mood,
      tags,
      autoGenerated,
      chatSummary,
      reflectionSummary,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO journal_entries (
        id, user_id, date, content, mood, tags, auto_generated,
        chat_summary, reflection_summary, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        uuid(),
        userId,
        date,
        content,
        mood,
        tags ?? [],
        autoGenerated ?? false,
        chatSummary ?? null,
        reflectionSummary ?? null,
        new Date(),
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ADD JOURNAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to add journal entry" });
  }
};

export const getJournalEntries = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET JOURNAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch journal entries" });
  }
};

export const updateJournalEntry = async (req: any, res: any) => {
  try {
    const { journalId } = req.params;
    const { content } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const result = await pool.query(
      `
      UPDATE journal_entries
      SET content = $1
      WHERE id = $2
      RETURNING *;
      `,
      [content, journalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("UPDATE JOURNAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to update journal entry" });
  }
};


export const deleteJournalEntry = async (req: any, res: any) => {
  try {
    const { journalId } = req.params;

    const result = await pool.query(
      `DELETE FROM journal_entries WHERE id = $1 RETURNING *;`,
      [journalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE JOURNAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete journal entry" });
  }
};

// ============================
// ✅ REFLECTIONS (DB)
// ============================
export const addReflection = async (req: any, res: any) => {
  try {
    const { userId, date, wins, challenges, gratitude, lessonsLearned, mood, energyLevel } = req.body;

    const result = await pool.query(
      `
      INSERT INTO reflections (
        id, user_id, date, wins, challenges, gratitude, lessons_learned, mood, energy_level, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
      `,
      [
        uuid(),
        userId,
        date,
        wins ?? [],
        challenges ?? [],
        gratitude ?? [],
        lessonsLearned ?? "",
        mood ?? "good",
        energyLevel ?? 5,
        new Date(),
      ]
 );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ADD REFLECTION ERROR:", error.message);
    res.status(500).json({ message: "Failed to add reflection" });
  }
};


export const getReflections = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM reflections WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET REFLECTIONS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch reflections" });
  }
};

// ============================
// ✅ MOOD LOGS (DB)  ✅ NEW
// ============================
export const addMoodLog = async (req: any, res: any) => {
  try {
    const { userId, source, inputText, emotionLabel, emotionScores } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO mood_logs (
        id, user_id, created_at, source, input_text, emotion_label, emotion_scores
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
      `,
      [
        uuid(),
        userId,
        new Date(),
        source ?? "coach",
        inputText ?? null,
        emotionLabel ?? null,
        emotionScores ?? null,
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ADD MOOD LOG ERROR:", error.message);
    res.status(500).json({ message: "Failed to save mood log" });
  }
};

export const getMoodLogs = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const limit = Number(req.query.limit ?? 30);
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 365) : 30;

    const result = await pool.query(
      `
      SELECT *
      FROM mood_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
      `,
      [userId, safeLimit]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET MOOD LOGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch mood logs" });
  }
};


export const getMoodLogsByMonth = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query; // month = 1..12

    if (!year || !month) {
      return res.status(400).json({ message: "year and month are required" });
    }

    const y = Number(year);
    const m = Number(month);

    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    const result = await pool.query(
      `
      SELECT *
      FROM mood_logs
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at < $3
      ORDER BY created_at ASC
      `,
      [userId, start, end]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET MOOD LOGS BY MONTH ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch mood logs" });
  }
};

const defaultAchievements = [
  {
    achievement_id: "first_habit",
    title: "First Step",
    description: "Complete your first habit",
    icon: "🌱",
    category: "milestone",
  },
  {
    achievement_id: "streak_7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    category: "streak",
  },
  {
    achievement_id: "streak_30",
    title: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "⭐",
    category: "streak",
  },
  {
    achievement_id: "first_reflection",
    title: "Mindful Moment",
    description: "Complete your first reflection",
    icon: "🧘",
    category: "milestone",
  },
  {
    achievement_id: "journal_10",
    title: "Story Teller",
    description: "Write 10 journal entries",
    icon: "📖",
    category: "milestone",
  },
  {
    achievement_id: "goals_3",
    title: "Goal Getter",
    description: "Set 3 goals",
    icon: "🎯",
    category: "milestone",
  },
  {
    achievement_id: "morning_prep_7",
    title: "Early Bird",
    description: "Complete 7 morning preps",
    icon: "🌅",
    category: "streak",
  },
  {
    achievement_id: "chat_coach_10",
    title: "Open Mind",
    description: "Have 10 coaching sessions",
    icon: "💬",
    category: "milestone",
  },
];

export const getAchievements = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    for (const a of defaultAchievements) {
      await pool.query(
        `INSERT INTO achievements (achievement_id, user_id, title, description, icon, category)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (achievement_id, user_id) DO NOTHING`,
        [a.achievement_id, userId, a.title, a.description, a.icon, a.category]
      );
    }

    const result = await pool.query(
      `SELECT * FROM achievements
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET ACHIEVEMENTS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch achievements" });
  }
};

export const unlockAchievement = async (req: any, res: any) => {
  try {
    const { userId, achievementId } = req.params;

    const def = defaultAchievements.find((a) => a.achievement_id === achievementId);

    if (def) {
      await pool.query(
        `INSERT INTO achievements (achievement_id, user_id, title, description, icon, category)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (achievement_id, user_id) DO NOTHING`,
        [def.achievement_id, userId, def.title, def.description, def.icon, def.category]
      );
    }

    const result = await pool.query(
      `UPDATE achievements
       SET unlocked_at = COALESCE(unlocked_at, $1)
       WHERE user_id = $2 AND achievement_id = $3
       RETURNING *`,
      [new Date(), userId, achievementId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("UNLOCK ACHIEVEMENT ERROR:", error.message);
    res.status(500).json({ message: "Failed to unlock achievement" });
  }
};