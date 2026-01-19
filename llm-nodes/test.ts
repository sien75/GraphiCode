import { ChatOpenAI } from "@langchain/openai";
import { tools } from "../tools/index";
import type { AgentState } from "../types";

// System prompt
const SYSTEM_PROMPT = `
You are a consulting assistant. You need to call the appropriate tools to answer user questions or follow instructions.
Remember use user's language to answer questions.
`;

// Initialize OpenRouter model (using OpenAI interface)
export const testAgent = new ChatOpenAI({
  modelName: "openai/gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools(tools);

// Agent node function
export async function callTestNode(state: AgentState) {
  const messages = state.messages || [];

  // current path information
  const currentPathInfo = `IMPORTANT: When calling tools that require a path parameter, always use workspacePath: "${state.path}". This is the current working directory.`;

  // add system prompt if no messages yet
  const firstPrompt = {
    role: "system",
    content: SYSTEM_PROMPT + currentPathInfo,
  };
  const invokeMessage = [firstPrompt, ...messages];

  const response = await testAgent.invoke(invokeMessage);

  return {
    messages: [...messages, response],
  };
}
