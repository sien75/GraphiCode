import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import type { AgentState, AppInfo } from "../types";

import { architectModelName, architectTools, architectSkill } from "./architect";
import {
  juniorEngineerModelName_ts_a,
  juniorEngineerTools_ts_a,
  juniorEngineerSkill_ts_a,
  juniorEngineerModelName_ts_s_Bun,
  juniorEngineerTools_ts_s_Bun,
  juniorEngineerSkill_ts_s_Bun,
} from "./junior-engineer";

const AGENT_CONFIGS = {
  architect: {
    modelName: architectModelName,
    tools: architectTools,
    skill: architectSkill,
  },
  juniorEngineer_ts_a: {
    modelName: juniorEngineerModelName_ts_a,
    tools: juniorEngineerTools_ts_a,
    skill: juniorEngineerSkill_ts_a,
  },
  juniorEngineer_ts_s_Bun: {
    modelName: juniorEngineerModelName_ts_s_Bun,
    tools: juniorEngineerTools_ts_s_Bun,
    skill: juniorEngineerSkill_ts_s_Bun,
  },
  // testEngineer: {
  //   modelName: testEngineerModelName,
  //   tools: testEngineerTools,
  //   skill: TEST_ENGINEER_SKILL,
  // },
};


const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

function shouldCallTools(state: any) {
  const messages = state.messages;
  if (!messages || messages.length === 0) {
    return "END";
  }

  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "toolsNode";
  }

  return "END";
}

function createAgentNode(modelName: string, tools: any[], skill: string) {
  const model = new ChatOpenAI({
    modelName,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });

  const agent = model.bindTools(tools);

  return async (state: AgentState) => {
    const messages = state.messages || [];

    // parameters information
    const parametersInfo = `
IMPORTANT: When calling tools that require parameters, here are the parameters:
* language: "${state.appInfo?.language}"
* workspacePath: "${state.workspacePath}"
* devEnv: "${state.appInfo?.devEnv}"
* runtimeEnv: "${state.appInfo?.runtimeEnv}"
`;

    // add system prompt if no messages yet
    const firstPrompt = {
      role: "system",
      content: skill + parametersInfo,
    };
    const invokeMessage = [firstPrompt, ...messages];

    const response = await agent.invoke(invokeMessage);

    return {
      messages: [...messages, response],
    };
  };
}

function createToolsNode(tools: any[]) {
  return async (state: AgentState) => {
    const result = await new ToolNode(tools).invoke(state);

    return {
      messages: [...state.messages, ...result.messages],
    };
  };
}

export async function runAgent(
  workspacePath: string,
  userPrompt: string,
  agentRole: string = "architect",
  appInfo: AppInfo | null = null
) {
  const config = AGENT_CONFIGS[agentRole as keyof typeof AGENT_CONFIGS];
  if (!config) {
    throw new Error(`Unknown agent role: ${agentRole}. Available roles: ${Object.keys(AGENT_CONFIGS).join(", ")}`);
  }

  const workflow = new StateGraph(AgentStateAnnotation);

  const agentNode = createAgentNode(config.modelName, config.tools, config.skill);
  const toolsNode = createToolsNode(config.tools);

  workflow
    .addNode("agentNode", agentNode)
    .addNode("toolsNode", toolsNode)
    .addEdge(START, "agentNode")
    .addConditionalEdges("agentNode", shouldCallTools, {
      toolsNode: "toolsNode",
      END: END,
    })
    .addEdge("toolsNode", "agentNode");

  const app = workflow.compile();

  const initialState: AgentState = {
    messages: [new HumanMessage(userPrompt)],
    workspacePath,
    appInfo,
  };

  return await app.stream(initialState);
}
