import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Note: In a real production app, you might want to proxy this through a backend to hide the key,
// but for this project, client-side is acceptable if the key is restricted.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-pro"
];

export type ChatMessage = {
  role: "user" | "model";
  parts: string;
};

const SYSTEM_PROMPT = `
You are MediLink AI, a helpful and professional medical triage assistant.
Your goal is to help users understand their symptoms and decide if they need to see a doctor.

RULES:
1. Be concise. Keep responses under 50 words unless explaining a complex condition.
2. Always end your response with a question to gather more info, OR a recommendation.
3. If the user mentions severe symptoms (chest pain, difficulty breathing, severe bleeding, stroke signs), IMMEDIATELY recommend calling emergency services (999/911).
4. Do NOT diagnose. Use phrases like "This could be..." or "It sounds like...".
5. At the end of every response, provide 3-4 short, actionable options for the user to click, formatted EXACTLY like this at the very end of the string:
   OPTIONS: [Option 1] [Option 2] [Option 3]

Example Response:
"Headaches can be caused by dehydration or stress. How long have you had it?"
OPTIONS: [Less than 1 day] [2-3 days] [More than a week]
`;

export const getGeminiResponse = async (history: ChatMessage[], userMessage: string) => {
  if (!API_KEY) {
    return {
      text: "I'm sorry, but I haven't been connected to the AI brain yet. Please add a VITE_GEMINI_API_KEY to your .env file.",
      options: ["Go back"]
    };
  }

  let lastError: any = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      // console.log(`Attempting to connect with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }],
          },
          {
            role: "model",
            parts: [{ text: "Understood. I am MediLink AI. I will follow the triage rules and format options as requested." }],
          },
          ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
          }))
        ],
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();

      // Parse options from the response
      const optionsRegex = /OPTIONS: (\[.*?\]\s*)+/g;
      const optionsMatch = text.match(optionsRegex);

      let cleanText = text.replace(optionsRegex, "").trim();
      let options: string[] = [];

      if (optionsMatch) {
        const rawOptions = optionsMatch[0].replace("OPTIONS:", "").trim();
        const matches = rawOptions.match(/\[(.*?)\]/g);
        if (matches) {
          options = matches.map(m => m.slice(1, -1));
        }
      }

      if (options.length === 0) {
        options = ["Tell me more", "Back to Dashboard"];
      }

      return {
        text: cleanText,
        options
      };

    } catch (error: any) {
      console.warn(`Failed with model ${modelName}:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }

  // If we get here, all models failed
  console.error("All Gemini models failed. Last error:", lastError);
  return {
    text: `I'm having trouble connecting to the medical database. (All models failed. Last error: ${lastError?.message || 'Unknown'})`,
    options: ["Retry", "Go to Dashboard"]
  };
};
