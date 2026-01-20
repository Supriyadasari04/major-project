import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

const PY_EMOTION_API = "http://127.0.0.1:8000";

export const analyzeEmotionAndSave = async (req: any, res: any) => {
  try {
    const { userId, text, source } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ message: "userId and text are required" });
    }

    // ✅ Call python API
    const pyRes = await fetch(`${PY_EMOTION_API}/api/emotion/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!pyRes.ok) {
      const errText = await pyRes.text();
      return res.status(500).json({
        message: "Python emotion service failed",
        error: errText,
      });
    }

    const data = await pyRes.json();

    const label = data?.label ?? "Neutral";
    const scores = data?.scores ?? {};

    // ✅ Store in mood_logs
    const insert = await pool.query(
      `
      INSERT INTO mood_logs (
        id, user_id, created_at, source, input_text, emotion_label, emotion_scores
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
      `,
      [uuid(), userId, new Date(), source ?? "coach", text, label, scores]
    );

    return res.json(insert.rows[0]);
  } catch (error: any) {
    console.error("analyzeEmotionAndSave ERROR:", error.message);
    return res.status(500).json({ message: "Failed to analyze emotion" });
  }
};

export const getMoodLogsByMonth = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    if (!year || !month) {
      return res.status(400).json({ message: "year and month required" });
    }

    const y = Number(year);
    const m = Number(month);

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const result = await pool.query(
      `
      SELECT *
      FROM mood_logs
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at < $3
      ORDER BY created_at ASC;
      `,
      [userId, start, end]
    );

    return res.json(result.rows);
  } catch (error: any) {
    console.error("getMoodLogsByMonth ERROR:", error.message);
    return res.status(500).json({ message: "Failed to fetch mood logs" });
  }
};
