#!/usr/bin/env bun
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentState } from "../types";
import { mainNode } from "../nodes/main";
import { displayNode } from "../nodes/display";
import { humanNode, rl } from "../nodes/human";
import { toolNode } from "../tools/index";

/* read path from command line arguments */

let path = Bun.argv[2];

/* if no path provided, show usage and exit */

if (!path) {
  console.error("Usage: graphicode <path>");
  console.error("Example: graphicode . or graphicode ./my-project");
  process.exit(1);
}

console.log(`Working directory: ${path}\n`);

/* Step 1: Define AgentState using Annotation */

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  path: Annotation<string>(),
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
  .addNode("tools", toolNode)
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
  path: path,
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
