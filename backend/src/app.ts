import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import chatRoutes from "./routes/chat.routes";
import emotionRoutes from "./routes/emotion.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Only once (you had it twice)
app.use("/api/emotion", emotionRoutes);

export default app;