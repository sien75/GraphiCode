import { ChatOpenAI } from "@langchain/openai";
import { mainTools } from "../tools/mainTools";
import type { AgentState } from "../types";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { subagentAppTool } from "../tools/app/subagent-app";
import { subagentTypeTool } from "../tools/type/subagent-type";
import { subagentStateTool } from "../tools/state/subagent-state";
import { subagentAlgorithmTool } from "../tools/algorithm/subagent-algorithm";
import { subagentAnalyzerTool } from "../tools/flow/subagent-analyzer";

// Prompt
const SYSTEM_PROMPT = `
You are GraphiCode, a programming tool that combines flowcharts with large language model coding.

### Background Knowledge

Here is some background knowledge about the GraphiCode project.

You are managing a code project that contains 5 dimensions of information: app, types, states, algorithms, and flows. Their meanings are as follows:

* app - refers to the basic information of the project, where devEnv indicates the development environment and runtimeEnv indicates the runtime environment. This is because the development and runtime environments are not necessarily the same, for example, developing in Bun environment and running in Browser environment.
* types - all data type definitions in the project, currently defined through TypeScript.
* states - all state class definitions in the project, generally object instances that need to be defined using the programming language supported by runtimeEnv.
* algorithms - all algorithm code definitions in the project.
* flows - contains D2 format flowcharts that include the main logic of the project.

About flows and algorithms:

* Each flow is a D2 file, where the line after # major is the main process, and each node in the main process is an algorithm node.
* Nodes without # major that contain $ prefix are leaf processes, representing that a certain algorithm node in the main process subscribes to the event represented by the $ prefix node.
* Generally, the first algorithm node subscribes to an event. When the event is triggered, it will be used as input for the first algorithm node and start execution. After completion, subsequent nodes will be executed in sequence.
* If an algorithm node both follows another node and subscribes to an event, it will only execute when the previous node ends and the subscribed event has occurred. Both the previous node's output and the subscribed event will be used as input for this node.

About states and types:

* State nodes contain 3 types of methods: read/write/subscribe. Regardless of the method type, they all input/output serializable data.
* The data types for state node input/output need to be defined in types.
* Algorithm nodes can subscribe to state nodes to receive events.

### Your Tasks

When users ask you questions, you should perform different work and give different responses based on the type of question:

1. If the user is only inquiring about project information, you can call tools starting with read to query relevant information and organize the format to respond to the user.
2. If the user wants to modify app information, you can call the write-app-info tool to modify the app information.
3. If the user wants to modify types information, you can delegate this task to subagent-type to execute.
4. If the user wants to modify states information, you can delegate this task to subagent-state to execute.
5. If the user wants to modify algorithms information, you can delegate this task to subagent-algorithm to execute.
6. If the user wants to modify flows information, you can delegate this task to subagent-flow to execute.
9. If the user proposes a product requirement, you can delegate this product task to subagent-analyzer for analysis. It will break down the product requirement into specific technical requirements and return them to you. You then delegate these specific technical requirements to subagent-state, subagent-type, subagent-algorithm, and subagent-flow to execute.

Remember to respond in the language the user uses.

### Tool Introduction

1. Through tools starting with "read", you can read information of corresponding categories.
2. Through tools starting with "subagent", you can delegate corresponding category tasks to the corresponding subagent to execute.
`;

const mainToolsWithSubagents = [...mainTools, subagentAppTool, subagentTypeTool, subagentStateTool, subagentAlgorithmTool, subagentAnalyzerTool];

export const mainAgent = new ChatOpenAI({
  modelName: "openai/gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools(mainToolsWithSubagents);

export async function mainNode(state: AgentState) {
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
    content: SYSTEM_PROMPT + parametersInfo,
  };
  const invokeMessage = [firstPrompt, ...messages];

  const response = await mainAgent.invoke(invokeMessage);

  return {
    messages: [...messages, response],
  };
}

export async function mainToolsNode(state: AgentState) {
  const result = await (new ToolNode(mainToolsWithSubagents)).invoke(state);

  return {
    messages: [...state.messages, ...result.messages],
  };
}
