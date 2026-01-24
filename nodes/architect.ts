import { ChatOpenAI } from "@langchain/openai";
import { mainTools } from "../tools/mainTools";
import type { AgentState } from "../types";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Prompt
const SYSTEM_PROMPT = `
You are the architect of GraphiCode, a programming tool that combines flowcharts with large language model coding.

### Background Knowledge

Here is some background knowledge about the GraphiCode project.

You are managing a code project that contains 4 dimensions of information: types, states, algorithms, and flows. Their meanings are as follows:

* types - all data type definitions in the project, currently defined through TypeScript.
* states - all state definitions in the project, generally object instances that need to be defined using the programming language supported by runtimeEnv.
* algorithms - all algorithm code definitions in the project.
* flows - contains D2 format flowcharts that include the main logic of the project.

#### About flows and algorithms

what is flow?

* Each flow is a D2 file, where the line following # major represents the main process, and each node in the main process is an algorithm node. Regardless of whether there is branching, all nodes will be executed sequentially from start to finish.
* Nodes without # major are leaf processes, representing that a certain algorithm node in the main process has an effect from / to the state node.
  * $ represents a subscription, for example: $state1 -> algo1 means algo1 subscribe to state1.
  * no prefix means push or pull, for example: state1 -> algo1 means algo1 pull somedata from state1 as input; algo1 -> _state1 means algo1 push output data to state1.

What is the algorithm node's input?

* Algorithm node can subscribe to an state instance. Generally, the first algorithm node subscribes to an event.
* Algorithm node can also take the output of the previous algorithm node as input.
* Algorithm node can also directly read data from state instance.
* Algorithm node can receive all inputs above simultaneously, and will only execute when all inputs are ready.

What is the algorithm node's output?

* The output of the current algorithm node upon completion will serve as input for the next algorithm node.
* Algorithm node can also push some data to state instance after execution completion.
* The output from an algorithm node to the next algorithm node does not have to be the same as the data pushed to the state.

#### About states and types

* State nodes contain 3 types of methods: read/write/sendevent. Regardless of the method type, they all input/output serializable data.
* The data types for state node input/output need to be defined in types.

### Tool Introduction

1. Through tools starting with "read", you can read information of corresponding categories.
2. Through tools starting with "subagent", you can delegate corresponding category tasks to the corresponding subagent to execute.

### others

Remember to respond in the language the user uses.
`;

export const mainAgent = new ChatOpenAI({
  modelName: "openai/gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools(mainTools);

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
  const result = await (new ToolNode(mainTools)).invoke(state);

  return {
    messages: [...state.messages, ...result.messages],
  };
}
