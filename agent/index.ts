import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentState } from "../types";

import { architectNode, architectToolsNode } from "./architect";

import { readAppInfo } from "../tools/app/read-app-info";

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
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
    return "architectToolsNode";
  }

  return "END";
}

export async function runGraphiCode(workspacePath: string) {
  const workflow = new StateGraph(AgentStateAnnotation);

  workflow
    .addNode("architectNode", architectNode)
    .addNode("architectToolsNode", architectToolsNode)
    .addEdge(START, "architectNode")
    .addConditionalEdges("architectNode", shouldCallTools, {
      architectToolsNode: "architectToolsNode",
      END: END,
    })
    .addEdge("architectToolsNode", "architectNode");

  const app = workflow.compile();

  const initialState: AgentState = {
    messages: [],
    types: [],
    states: [],
    algorithms: [],
    flows: [],
    workspacePath,
    appInfo: await readAppInfo(workspacePath),
  };

  return await app.stream(initialState);
}
