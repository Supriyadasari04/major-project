import { Router } from "express";
import {
  createChatSession,
  getChatSessions,
  getChatMessages,
  addChatMessage,
  renameChatSession,
  pinChatSession,
  deleteChatSession,
} from "../controllers/chat.controller";

const router = Router();

router.post("/sessions", createChatSession);
router.get("/sessions/:userId", getChatSessions);

router.get("/messages/:sessionId", getChatMessages);
router.post("/messages/:sessionId", addChatMessage);

router.put("/sessions/:sessionId/rename", renameChatSession);
router.patch("/sessions/:sessionId/pin", pinChatSession);
router.delete("/sessions/:sessionId", deleteChatSession);

export default router;
