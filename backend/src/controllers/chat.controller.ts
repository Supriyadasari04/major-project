import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

export const createChatSession = async (req: any, res: any) => {
  try {
    const { userId, title } = req.body;

    if (!userId) return res.status(400).json({ message: "userId required" });

    const sessionId = uuid();
    const chatTitle = title?.trim() || "New Chat";

    const result = await pool.query(
      `INSERT INTO chat_sessions (id, user_id, title, pinned, archived, created_at, updated_at)
       VALUES ($1,$2,$3,false,false,now(),now())
       RETURNING *`,
      [sessionId, userId, chatTitle]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("CREATE CHAT SESSION ERROR:", error.message);
    res.status(500).json({ message: "Failed to create chat session" });
  }
};

export const getChatSessions = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE user_id = $1 AND archived = false
       ORDER BY pinned DESC, updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET CHAT SESSIONS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch chat sessions" });
  }
};

export const getChatMessages = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT * FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("GET CHAT MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch chat messages" });
  }
};

export const addChatMessage = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ message: "role and content required" });
    }

    const msgId = uuid();

    const inserted = await pool.query(
      `INSERT INTO chat_messages (id, session_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,now())
       RETURNING *`,
      [msgId, sessionId, role, content]
    );

    await pool.query(
      `UPDATE chat_sessions SET updated_at = now() WHERE id = $1`,
      [sessionId]
    );

    if (role === "assistant") {
      const sessionRes = await pool.query(
        `SELECT id, user_id, counted_for_achievement
         FROM chat_sessions
         WHERE id = $1`,
        [sessionId]
      );

      const session = sessionRes.rows[0];

      if (session && session.counted_for_achievement === false) {
        const countsRes = await pool.query(
          `SELECT
            SUM(CASE WHEN role='user' THEN 1 ELSE 0 END) AS user_count,
            SUM(CASE WHEN role='assistant' THEN 1 ELSE 0 END) AS assistant_count
           FROM chat_messages
           WHERE session_id = $1`,
          [sessionId]
        );

        const userCount = Number(countsRes.rows[0]?.user_count ?? 0);
        const assistantCount = Number(countsRes.rows[0]?.assistant_count ?? 0);

        if (userCount >= 1 && assistantCount >= 1) {
          await pool.query(
            `UPDATE chat_sessions
             SET counted_for_achievement = true
             WHERE id = $1`,
            [sessionId]
          );

          const totalRes = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM chat_sessions
             WHERE user_id = $1 AND counted_for_achievement = true`,
            [session.user_id]
          );

          const totalCompleted = Number(totalRes.rows[0]?.total ?? 0);

          if (totalCompleted >= 10) {
            await pool.query(
              `UPDATE achievements
               SET unlocked_at = COALESCE(unlocked_at, now())
               WHERE user_id = $1 AND achievement_id = 'chat_coach_10'`,
              [session.user_id]
            );
          }
        }
      }
    }

    res.json(inserted.rows[0]);
  } catch (error: any) {
    console.error("ADD CHAT MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Failed to add chat message" });
  }
};

export const renameChatSession = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "title required" });
    }

    const result = await pool.query(
      `UPDATE chat_sessions
       SET title = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [title.trim(), sessionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("RENAME CHAT SESSION ERROR:", error.message);
    res.status(500).json({ message: "Failed to rename session" });
  }
};

export const pinChatSession = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `UPDATE chat_sessions
       SET pinned = NOT pinned, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("PIN CHAT SESSION ERROR:", error.message);
    res.status(500).json({ message: "Failed to pin/unpin session" });
  }
};

export const deleteChatSession = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `DELETE FROM chat_sessions WHERE id = $1 RETURNING *`,
      [sessionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE CHAT SESSION ERROR:", error.message);
    res.status(500).json({ message: "Failed to delete session" });
  }
};
