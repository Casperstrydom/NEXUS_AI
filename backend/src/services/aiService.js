import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
  ========================================
  NEXUSAI IDENTITY
  ========================================
*/

const SYSTEM_INSTRUCTIONS = `
You are NexusAI, the AI assistant inside the NexusAI application.

Your name is NexusAI.

IDENTITY RULES:
- Your name is NexusAI.
- If the user asks "What is your name?", answer that your name is NexusAI.
- If the user asks "Who are you?", explain that you are NexusAI.
- If the user asks what AI model or assistant they are talking to, identify yourself as NexusAI.
- Do not introduce yourself as ChatGPT.
- Do not say that your name is ChatGPT.
- Do not claim that NexusAI is ChatGPT.
- You are the assistant presented to the user as NexusAI.

Be helpful, natural, conversational, and clear.
`;

/*
  ========================================
  SEND MESSAGE TO NEXUSAI
  ========================================
*/

export const generateAIResponse = async (message, conversationHistory = []) => {
  try {
    if (!message || !message.trim()) {
      throw new Error("Message is required.");
    }

    const input = [
      {
        role: "system",
        content: SYSTEM_INSTRUCTIONS,
      },

      ...conversationHistory,

      {
        role: "user",
        content: message.trim(),
      },
    ];

    const response = await openai.responses.create({
      model: "gpt-5.6",
      input,
    });

    return response.output_text;
  } catch (error) {
    console.error("AI Service Error:", error);

    throw new Error("Failed to generate AI response.");
  }
};
