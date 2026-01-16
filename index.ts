#!/usr/bin/env bun
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentState } from "./types";
import { callTestNode } from "./nodes/test";
import { toolNode } from "./tools/index";
import * as readline from "readline";

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
    return "end";
  }

  const lastMessage = messages[messages.length - 1];

  // If the last message has tool calls, go to tools
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }

  // Otherwise, end (return to user)
  return "end";
}

const workflow = new StateGraph(AgentStateAnnotation);

workflow
  .addNode("testNode", callTestNode)
  .addNode("tools", toolNode)
  .addEdge(START, "testNode")
  .addConditionalEdges("testNode", shouldCallTools, {
    tools: "tools",
    end: END,
  })
  .addEdge("tools", "testNode");

const app = workflow.compile();

/* Command line interaction */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let currentState: AgentState = {
  messages: [],
  types: [],
  states: [],
  algorithms: [],
  flows: [],
  path: path,
};

console.log("\n=== GraphiCode Chat ===");
console.log("Type your questions and press Enter\n");

function prompt() {
  rl.question("You: ", async (input) => {
    if (!input.trim()) {
      prompt();
      return;
    }

    /* Add user message */

    const userMessage = new HumanMessage(input);
    currentState.messages.push(userMessage);

    /* Invoke the agent */

    try {
      const result = await app.invoke(currentState);
      currentState = result;

      /* Display tool results and assistant message */

      const messages = result.messages;

      // Check if second to last message is a tool message
      if (messages.length >= 2) {
        const secondLastMessage = messages[messages.length - 2];
        if (secondLastMessage && secondLastMessage.type === "tool") {
          console.log(`\n[Tool Result]: ${secondLastMessage.content}\n`);
        }
      }

      // Display the latest assistant message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.content) {
        console.log(`Assistant: ${lastMessage.content}\n`);
      }
    } catch (error) {
      console.error(`\nError: ${error}\n`);
    }

    prompt();
  });
}

prompt();
