import { ChatOpenAI } from "@langchain/openai";
import type { AgentState } from "../types";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import ARCHITECT_SKILL from "skills/architect.md" with { type: "text" };

// Algorithm tools
import { readAllAlgorithmsTool } from "../tools/algorithm/read-all-algorithms";
import { readAlgorithmReadmeByIdTool } from "../tools/algorithm/read-algorithm-readme-by-id";
import { writeAlgorithmReadmeByIdTool } from "../tools/algorithm/write-algorithm-readme-by-id";

// State tools
import { readAllStatesTool } from "../tools/state/read-all-states";
import { readStateReadmeByIdTool } from "../tools/state/read-state-readme-by-id";
import { writeStateReadmeByIdTool } from "../tools/state/write-state-readme-by-id";

// Type tools
import { readAllTypesTool } from "../tools/type/read-all-types";
import { readTypeByIdTool } from "../tools/type/read-type-by-id";
import { writeTypeByIdTool } from "../tools/type/write-type-by-id";

// Flow tools
import { readAllFlowsTool } from "../tools/flow/read-all-flows";
import { readFlowCodeByIdTool } from "../tools/flow/read-flow-code-by-id";
import { writeFlowCodeByIdTool } from "../tools/flow/write-flow-code-by-id";

const tools = [
  readAllAlgorithmsTool,
  readAlgorithmReadmeByIdTool,
  writeAlgorithmReadmeByIdTool,
  readAllStatesTool,
  readStateReadmeByIdTool,
  writeStateReadmeByIdTool,
  readAllTypesTool,
  readTypeByIdTool,
  writeTypeByIdTool,
  readAllFlowsTool,
  readFlowCodeByIdTool,
  writeFlowCodeByIdTool,
];

export const architectAgent = new ChatOpenAI({
  modelName: "anthropic/claude-sonnet-4.5",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools(tools);

export async function architectNode(state: AgentState) {
  const messages = state.messages || [];

  // parameters information
  const parametersInfo = `
IMPORTANT: When calling tools that require parameters, here are the parameters:
* workspacePath: "${state.workspacePath}"
* devEnv: "${state.appInfo?.devEnv}"
* runtimeEnv: "${state.appInfo?.runtimeEnv}"
`;

  // add system prompt if no messages yet
  const firstPrompt = {
    role: "system",
    content: ARCHITECT_SKILL + parametersInfo,
  };
  const invokeMessage = [firstPrompt, ...messages];

  const response = await architectAgent.invoke(invokeMessage);

  return {
    messages: [...messages, response],
  };
}

export async function architectToolsNode(state: AgentState) {
  const result = await (new ToolNode(tools)).invoke(state);

  return {
    messages: [...state.messages, ...result.messages],
  };
}
