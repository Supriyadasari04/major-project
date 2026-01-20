const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

const SYSTEM_PROMPT = `You are Justly, a warm, empathetic, and supportive AI life coach and wellness companion. Your role is to:

1. **Listen without judgment** - Create a safe space for users to express their thoughts and feelings
2. **Provide gentle guidance** - Offer actionable advice that aligns with their goals
3. **Encourage reflection** - Help users gain self-awareness through thoughtful questions
4. **Support habit formation** - Guide users in building positive daily routines
5. **Celebrate progress** - Acknowledge wins, no matter how small

Your communication style:
- Warm, friendly, and conversational (like a supportive friend)
- Use encouraging language and positive framing
- Keep responses concise but meaningful (2-4 paragraphs max)
- Ask thoughtful follow-up questions when appropriate
- Use occasional emojis sparingly to add warmth 🌟

Remember: You're not a replacement for professional therapy. If someone shares serious mental health concerns, gently encourage them to seek professional help while still being supportive.

Always refer to the user's goals, habits, and progress when relevant to make advice personalized.`;

export const sendMessage = async (
  userMessage: string,
  chatHistory: { role: "user" | "assistant"; content: string }[],
  context?: {
    goals?: string[];
    habits?: string[];
    recentMood?: string;
  }
): Promise<string> => {
  let contextString = "";
  if (context) {
    if (context.goals?.length) {
      contextString += `\n\nUser's current goals: ${context.goals.join(", ")}`;
    }
    if (context.habits?.length) {
      contextString += `\nUser's habits: ${context.habits.join(", ")}`;
    }
    if (context.recentMood) {
      contextString += `\nRecent mood: ${context.recentMood}`;
    }
  }

  const fullSystemPrompt = SYSTEM_PROMPT + contextString;

  const contents: GeminiMessage[] = chatHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const request: GeminiRequest = {
    contents,
    systemInstruction: {
      parts: [{ text: fullSystemPrompt }],
    },
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      if (response.status === 429) {
        return (
          "Looks like the AI service hit its usage limit right now (quota/rate limit) 😅\n\n" +
          "No worries — tell me what you want to achieve today, and I’ll help you break it into 3 small steps you can do immediately."
        );
      }
      return (
        "I'm having trouble connecting to the AI service right now.\n\n" +
        "But I can still help — what’s one goal you want to focus on today?"
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return (
        "I didn’t receive a response from the AI service.\n\n" +
        "Tell me what you're feeling today, and I’ll help you reflect and plan your next step."
      );
    }

    return text;
  } catch (error) {
    console.error("Error calling Gemini:", error);

    return (
      "I couldn’t reach the AI service due to a network issue.\n\n" +
      "Still here with you — tell me what’s on your mind, and I’ll support you through it."
    );
  }
};


export const generateMorningTasks = async (
  goals: { title: string; category: string }[],
  habits: { title: string; category: string }[],
  previousDay?: { completedTasks: number; totalTasks: number; mood: string }
): Promise<{ title: string; priority: 'low' | 'medium' | 'high'; description?: string }[]> => {
  const prompt = `Based on the user's goals and habits, generate 5-7 actionable tasks for today.

Goals: ${goals.map(g => `${g.title} (${g.category})`).join(', ') || 'None set yet'}
Habits: ${habits.map(h => `${h.title} (${h.category})`).join(', ') || 'None set yet'}
${previousDay ? `Yesterday: Completed ${previousDay.completedTasks}/${previousDay.totalTasks} tasks, mood was ${previousDay.mood}` : ''}

Return ONLY a JSON array with objects containing: title, priority (low/medium/high), description (optional).
Example: [{"title": "Morning meditation", "priority": "high", "description": "10 minutes of mindfulness"}]
Do not include any other text, just the JSON array.`;

  const request: GeminiRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: 'You are a task generation assistant. Return only valid JSON arrays, no additional text.' }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error('Failed to generate tasks');

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error generating tasks:', error);
    return [
      { title: 'Start your day with intention', priority: 'high' as const },
      { title: 'Review your goals', priority: 'medium' as const },
      { title: 'Complete one habit', priority: 'medium' as const },
    ];
  }
};

export const generateJournalEntry = async (
  chatMessages: { role: string; content: string }[],
  reflection?: {
    wins: string[];
    challenges: string[];
    mood: string;
    lessonsLearned: string;
  },
  tasksCompleted?: number,
  totalTasks?: number
): Promise<string> => {
  const prompt = `Create a reflective journal entry based on the following:

${chatMessages.length > 0 ? `Conversations today:\n${chatMessages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')}\n` : ''}
${reflection ? `Evening reflection:
- Wins: ${reflection.wins.join(', ') || 'None noted'}
- Challenges: ${reflection.challenges.join(', ') || 'None noted'}
- Mood: ${reflection.mood}
- Lessons: ${reflection.lessonsLearned || 'None noted'}` : ''}
${tasksCompleted !== undefined ? `Tasks: ${tasksCompleted}/${totalTasks} completed` : ''}

Write a first-person journal entry (2-3 paragraphs) that captures the essence of the day, insights gained, and looks forward positively. Make it personal and reflective.`;

  const request: GeminiRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: 'You are helping write a personal journal entry. Write in first person, be reflective and warm.' }],
    },
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 512,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error('Failed to generate journal');

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Today was a day of growth and learning.';
  } catch (error) {
    console.error('Error generating journal:', error);
    return 'Today was a day of growth and learning. I continued working on my goals and habits.';
  }
};

export const generateReflectionPrompts = async (
  mood: string,
  tasksCompleted: number,
  habits: string[]
): Promise<string[]> => {
  const prompt = `Generate 3 thoughtful reflection prompts for someone who:
- Current mood: ${mood}
- Completed ${tasksCompleted} tasks today
- Working on habits: ${habits.join(', ') || 'general wellness'}

Return ONLY a JSON array of 3 prompt strings. No other text.
Example: ["What moment brought you the most joy today?", "What would you do differently?", "What are you grateful for?"]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
      }),
    });

    if (!response.ok) throw new Error('Failed to generate prompts');

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return defaultPrompts;
  } catch {
    return defaultPrompts;
  }
};

const defaultPrompts = [
  "What moment today made you feel most alive?",
  "What's one thing you learned about yourself?",
  "What are you grateful for right now?",
];
