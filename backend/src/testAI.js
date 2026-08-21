import dotenv from "dotenv";

dotenv.config();

const { generateAIResponse } = await import("./services/aiService.js");

const response = await generateAIResponse(
  "Hello NexusAI! Introduce yourself in one sentence.",
);

console.log("\nAI RESPONSE:\n");
console.log(response);
