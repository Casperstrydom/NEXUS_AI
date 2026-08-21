import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
  Send a message to the NexusAI AI model
*/
export const generateAIResponse = async (message, conversationHistory = []) => {
  try {
    if (!message || !message.trim()) {
      throw new Error("Message is required.");
    }

    const input = [
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
