import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { appNode } from "../../nodes/app";
import { readAppInfoTool } from "./read-app-info";
import { writeAppInfoTool } from "./write-app-info";

// App tools for this subagent
const appTools = [readAppInfoTool, writeAppInfoTool];

// Define state annotation for the app subagent
const AppStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Tools node - handles tool calls
async function appToolsNode(state: typeof AppStateAnnotation.State) {
  const toolNode = new ToolNode(appTools);
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
  };
}

// Router function - decides whether to continue to tools or end
function shouldContinue(state: typeof AppStateAnnotation.State): string {
  const messages = state.messages;
  if (!messages || messages.length === 0) {
    return 'END';
  }

  const lastMessage = messages[messages.length - 1];

  // If the last message has tool calls, continue to tools
  if (lastMessage && "tool_calls" in lastMessage && (lastMessage as any).tool_calls?.length > 0) {
    return "tools";
  }

  // Otherwise, end
  return 'END';
}

// Build the graph
const appWorkflow = new StateGraph(AppStateAnnotation)
  .addNode("app", appNode)
  .addNode("tools", appToolsNode)
  .addEdge(START, "app")
  .addConditionalEdges("app", shouldContinue, {
    tools: "tools",
    END: END,
  })
  .addEdge("tools", "app");

// Compile the graph
const appGraph = appWorkflow.compile();

// Create the subagent tool wrapper
const subagentAppSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The app-related task to perform"),
});

export const subagentAppTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.task) {
      throw new Error("task is required");
    }

    // Create initial state
    const initialState = {
      messages: [new HumanMessage(input.task)],
      types: [],
      states: [],
      algorithms: [],
      flows: [],
      workspacePath: input.workspacePath,
      appInfo: null,
    };

    console.log('[subagent-app] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await appGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-app",
    description:
      "Delegate app-related tasks to the app subagent. Use this when you need to read or modify application information (graphig.json, README.md, package.json).",
    schema: subagentAppSchema,
  }
);
