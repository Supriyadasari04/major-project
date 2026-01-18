// import { pool } from "../config/db";
// import { v4 as uuid } from "uuid";

// export const addGoal = async (req: any, res: any) => {
//   console.log("ADD GOAL HIT", req.body);
//   const { userId, title, description, category } = req.body;

//   const result = await pool.query(
//     `INSERT INTO goals (id, user_id, title, description, category, created_at)
//      VALUES ($1, $2, $3, $4, $5, $6)
//      RETURNING *`,
//     [uuid(), userId, title, description, category, new Date()]
//   );

//   res.json(result.rows[0]);
// };

// export const getGoals = async (req: any, res: any) => {
//   const { userId } = req.params;
//   const result = await pool.query(
//     "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC",
//     [userId]
//   );
//   res.json(result.rows);
// };

// export const addHabit = async (req: any, res: any) => {
//   console.log("ADD HABIT HIT", req.body);
//   const { userId, title, description, category, frequency } = req.body;

//   const result = await pool.query(
//     `INSERT INTO habits (id, user_id, title, description, category, frequency, created_at)
//      VALUES ($1, $2, $3, $4, $5, $6, $7)
//      RETURNING *`,
//     [uuid(), userId, title, description, category, frequency, new Date()]
//   );

//   res.json(result.rows[0]);
// };

// export const getHabits = async (req: any, res: any) => {
//   const { userId } = req.params;
//   const result = await pool.query(
//     "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC",
//     [userId]
//   );
//   res.json(result.rows);
// };

// export const setOnboardingComplete = async (req: any, res: any) => {
//   const { userId } = req.body;

//   await pool.query(
//     "UPDATE users SET onboarding_complete = true WHERE id = $1",
//     [userId]
//   );

//   res.json({ success: true });
// };

// export const getOnboardingStatus = async (req: any, res: any) => {
//   const { userId } = req.params;

//   const result = await pool.query(
//     "SELECT onboarding_complete FROM users WHERE id = $1",
//     [userId]
//   );

//   res.json({ completed: result.rows[0]?.onboarding_complete });
// };

// export const completeHabit = async (req: any, res: any) => {
//   const { habitId } = req.params;
//   const today = new Date().toISOString().split("T")[0];

//   const result = await pool.query(
//     `
//     UPDATE habits
//     SET
//       completed_dates = 
//         CASE 
//           WHEN NOT ($1 = ANY(completed_dates)) 
//           THEN array_append(completed_dates, $1)
//           ELSE completed_dates
//         END,
//       streak = streak + 1
//     WHERE id = $2
//     RETURNING *
//     `,
//     [today, habitId]
//   );

//   res.json(result.rows[0]);
// };

// export const uncompleteHabit = async (req: any, res: any) => {
//   const { habitId } = req.params;
//   const today = new Date().toISOString().split("T")[0];

//   const result = await pool.query(
//     `
//     UPDATE habits
//     SET
//       completed_dates = array_remove(completed_dates, $1),
//       streak = GREATEST(streak - 1, 0)
//     WHERE id = $2
//     RETURNING *
//     `,
//     [today, habitId]
//   );

//   res.json(result.rows[0]);
// };


















































import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

export const addGoal = async (req: any, res: any) => {
  console.log("ADD GOAL HIT", req.body);
  const { userId, title, description, category } = req.body;

  const result = await pool.query(
    `INSERT INTO goals (id, user_id, title, description, category, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [uuid(), userId, title, description, category, new Date()]
  );

  res.json(result.rows[0]);
};

export const getGoals = async (req: any, res: any) => {
  const { userId } = req.params;
  const result = await pool.query(
    "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC",
    [userId]
  );
  res.json(result.rows);
};

export const updateGoal = async (req: any, res: any) => {
  try {
    const { goalId } = req.params;
    const { title, description, category, progress } = req.body;

    const result = await pool.query(
      `UPDATE goals
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           progress = COALESCE($4, progress)
       WHERE id = $5
       RETURNING *`,
      [title ?? null, description ?? null, category ?? null, progress ?? null, goalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("UPDATE GOAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to update goal" });
  }
};

export const deleteGoal = async (req: any, res: any) => {
  try {
    const { goalId } = req.params;

    const result = await pool.query(
      "DELETE FROM goals WHERE id = $1 RETURNING *",
      [goalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

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
  const { userId } = req.params;
  const result = await pool.query(
    "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC",
    [userId]
  );
  res.json(result.rows);
};

export const completeHabit = async (req: any, res: any) => {
  try {
    const { habitId } = req.params;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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
            -- if already completed today, don't change streak
            WHEN $1 = ANY(COALESCE(completed_dates, '{}')) THEN streak

            -- if last_completed_date was yesterday -> +1
            WHEN last_completed_date = ($1::date - INTERVAL '1 day')::date THEN COALESCE(streak, 0) + 1

            -- otherwise reset to 1
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

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("COMPLETE HABIT ERROR:", error.message);
    res.status(500).json({ message: "Failed to complete habit" });
  }
};


export const uncompleteHabit = async (req: any, res: any) => {
  try {
    const { habitId } = req.params;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const result = await pool.query(
      `
      UPDATE habits
      SET
        completed_dates = array_remove(COALESCE(completed_dates, '{}'), $1),

        -- if user uncompletes today, reset streak safely
        -- (real recalculation needs more history tracking, but this is consistent)
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

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("UNCOMPLETE HABIT ERROR:", error.message);
    res.status(500).json({ message: "Failed to uncomplete habit" });
  }
};


export const deleteHabit = async (req: any, res: any) => {
  try {
    const { habitId } = req.params;

    const result = await pool.query(
      "DELETE FROM habits WHERE id = $1 RETURNING *",
      [habitId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE HABIT ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete habit" });
  }
};


export const setOnboardingComplete = async (req: any, res: any) => {
  const { userId } = req.body;

  await pool.query(
    "UPDATE users SET onboarding_complete = true WHERE id = $1",
    [userId]
  );

  res.json({ success: true });
};

export const getOnboardingStatus = async (req: any, res: any) => {
  const { userId } = req.params;

  const result = await pool.query(
    "SELECT onboarding_complete FROM users WHERE id = $1",
    [userId]
  );

  res.json({ completed: result.rows[0]?.onboarding_complete });
};


// ✅ TASKS (DB)
export const addTask = async (req: any, res: any) => {
  try {
    const { userId, title, description, completed, date, habitId, goalId, priority } = req.body;

    if (!userId || !title || !date || !priority) {
      return res.status(400).json({ message: "Missing required fields" });
    }

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
        priority,
        new Date(),
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("ADD TASK ERROR:", error.message);
    res.status(500).json({ message: "Failed to add task" });
  }
};

export const getTasksByDate = async (req: any, res: any) => {
  try {
    const { userId, date } = req.params;

    const result = await pool.query(
      `SELECT * FROM tasks
       WHERE user_id = $1 AND date = $2
       ORDER BY created_at ASC`,
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
      `UPDATE tasks
       SET completed = NOT completed
       WHERE id = $1
       RETURNING *`,
      [taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("TOGGLE TASK ERROR:", error.message);
    res.status(500).json({ message: "Failed to toggle task" });
  }
};

export const deleteTask = async (req: any, res: any) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE TASK ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete task" });
  }
};


// ============================
// ✅ SETTINGS (DB)
// ============================
export const getSettings = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM settings WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    // ✅ If no settings row exists, create default row
    if (result.rowCount === 0) {
      const newRow = await pool.query(
        `INSERT INTO settings (
          id, user_id,
          notifications, morning_prep_time, evening_reflection_time,
          theme, share_analytics, show_streak,
          created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
          uuid(),
          userId,
          true,
          "07:00",
          "21:00",
          "light",
          false,
          true,
          new Date(),
          new Date(),
        ]
      );

      const row = newRow.rows[0];

      return res.json({
        notifications: row.notifications,
        morningPrepTime: row.morning_prep_time,
        eveningReflectionTime: row.evening_reflection_time,
        theme: row.theme,
        privacy: {
          shareAnalytics: row.share_analytics,
          showStreak: row.show_streak,
        },
      });
    }

    const row = result.rows[0];

    return res.json({
  notifications: row.notifications,
  morningPrepTime: row.morning_prep_time,
  eveningReflectionTime: row.evening_reflection_time,
  theme: row.theme,
  morningPrepCount: row.morning_prep_count ?? 0,
  privacy: {
    shareAnalytics: row.share_analytics,
    showStreak: row.show_streak,
  },
});

  } catch (error: any) {
    console.error("GET SETTINGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to get settings" });
  }
};


export const updateSettings = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

const {
  notifications,
  morningPrepTime,
  eveningReflectionTime,
  theme,
  privacy,
  morningPrepCount,
} = req.body;


    // privacy = { shareAnalytics, showStreak }
    const shareAnalytics = privacy?.shareAnalytics;
    const showStreak = privacy?.showStreak;

const result = await pool.query(
  `UPDATE settings
   SET
     notifications = COALESCE($1, notifications),
     morning_prep_time = COALESCE($2, morning_prep_time),
     evening_reflection_time = COALESCE($3, evening_reflection_time),
     theme = COALESCE($4, theme),
     share_analytics = COALESCE($5, share_analytics),
     show_streak = COALESCE($6, show_streak),
     morning_prep_count = COALESCE($7, morning_prep_count),
     updated_at = $8
   WHERE user_id = $9
   RETURNING *`,
  [
    notifications ?? null,
    morningPrepTime ?? null,
    eveningReflectionTime ?? null,
    theme ?? null,
    shareAnalytics ?? null,
    showStreak ?? null,
    morningPrepCount ?? null,
    new Date(),
    userId,
  ]
);


    if (result.rowCount === 0) {
  return res.status(404).json({ message: "Settings not found for user" });
}

    const row = result.rows[0];

return res.json({
  notifications: row.notifications,
  morningPrepTime: row.morning_prep_time,
  eveningReflectionTime: row.evening_reflection_time,
  theme: row.theme,
  morningPrepCount: row.morning_prep_count ?? 0,
  privacy: {
    shareAnalytics: row.share_analytics,
    showStreak: row.show_streak,
  },
});


  } catch (error: any) {
    console.error("UPDATE SETTINGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to update settings" });
  }
};

// ============================
// ✅ REFLECTIONS (DB)
// ============================
export const addReflection = async (req: any, res: any) => {
  try {
    const {
      userId,
      date,
      wins,
      challenges,
      gratitude,
      lessonsLearned,
      mood,
      energyLevel,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO reflections (
        id, user_id, date, wins, challenges, gratitude,
        lessons_learned, mood, energy_level, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        uuid(),
        userId,
        date,
        wins ?? [],
        challenges ?? [],
        gratitude ?? [],
        lessonsLearned ?? "",
        mood,
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

    const result = await pool.query(
      `UPDATE journal_entries
       SET content = COALESCE($1, content)
       WHERE id = $2
       RETURNING *`,
      [content ?? null, journalId]
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
      `DELETE FROM journal_entries WHERE id = $1 RETURNING *`,
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
// ✅ ACHIEVEMENTS (DB)
// ============================

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

    // ✅ ensure defaults exist in DB for this user
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

    // ✅ Ensure this achievement row exists for the user (create if missing)
    const def = defaultAchievements.find((a) => a.achievement_id === achievementId);

    if (def) {
      await pool.query(
        `INSERT INTO achievements (achievement_id, user_id, title, description, icon, category)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (achievement_id, user_id) DO NOTHING`,
        [def.achievement_id, userId, def.title, def.description, def.icon, def.category]
      );
    }

    // ✅ Now unlock it
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
