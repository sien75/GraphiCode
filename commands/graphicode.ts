#!/usr/bin/env bun
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentState } from "../types";

import { mainNode, mainToolsNode } from "../nodes/architect";
import { displayNode } from "../nodes/display";
import { humanNode } from "../nodes/human";

import { readAppInfo } from "../tools/app/read-app-info";

/* read workspacePath from command line arguments */

let workspacePath = Bun.argv[2];

/* if no workspace provided, show usage and exit */

if (!workspacePath) {
  console.error("Usage: graphicode <workspacePath>");
  console.error("Example: graphicode . or graphicode ./my-project");
  process.exit(1);
}

console.log(`Working directory: ${workspacePath}\n`);

/* Step 1: Define AgentState using Annotation */

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

/* Step 2: Initialize LangGraph workflow and build chain */

function shouldCallTools(state: any) {
  const messages = state.messages;
  if (!messages || messages.length === 0) {
    return "display";
  }

  const lastMessage = messages[messages.length - 1];

  // If the last message has tool calls, go to tools
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }

  // Otherwise, go to display node to show messages
  return "display";
}

const workflow = new StateGraph(AgentStateAnnotation);

workflow
  .addNode("mainNode", mainNode)
  .addNode("tools", mainToolsNode)
  .addNode("display", displayNode)
  .addNode("human", humanNode)
  .addEdge(START, "human")
  .addEdge("human", "mainNode")
  .addConditionalEdges("mainNode", shouldCallTools, {
    tools: "tools",
    display: "display",
  })
  .addEdge("tools", "mainNode")
  .addEdge("display", "human");

const app = workflow.compile();

/* Command line interaction */

const initialState: AgentState = {
  messages: [],
  types: [],
  states: [],
  algorithms: [],
  flows: [],
  workspacePath,
  appInfo: await readAppInfo(workspacePath), // read app info from workspacePath at start
};

console.log("\n=== GraphiCode Chat ===");
console.log("Type your questions and press Enter\n");

/* Start the workflow - it will loop indefinitely */

try {
  await app.invoke(initialState);
} catch (error) {
  console.error(`\nError: ${error}\n`);
  process.exit(1);
}
