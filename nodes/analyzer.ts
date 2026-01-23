import { ChatOpenAI } from "@langchain/openai";
import type { AgentState } from "../types";

// System Prompt
const SYSTEM_PROMPT = ``;

// Create the analyzer agent (no tools needed for analyzer)
export const analyzerAgent = new ChatOpenAI({
  modelName: "openai/gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

/**
 * Analyzer node - analyzes product requirements and breaks them down into technical tasks
 */
export async function analyzerNode(state: AgentState): Promise<Partial<AgentState>> {
  const messages = state.messages || [];

  // Parameters information
  const parametersInfo = ``;

  // Add system prompt
  const firstPrompt = {
    role: "system",
    content: SYSTEM_PROMPT + parametersInfo,
  };
  const invokeMessage = [firstPrompt, ...messages];

  const response = await analyzerAgent.invoke(invokeMessage);

  return {
    messages: [...messages, response],
  };
}
