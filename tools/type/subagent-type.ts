import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { typeNode } from "../../nodes/type";
import { readAllTypesTool } from "./read-all-types";
import { readTypeByIdTool } from "./read-type-by-id";
import { writeTypeByIdTool } from "./write-type-by-id";

// Type tools for this subagent
const typeTools = [
  readAllTypesTool,
  readTypeByIdTool,
  writeTypeByIdTool,
];

// Define state annotation for the type subagent
const TypeStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Tools node - handles tool calls
async function typeToolsNode(state: typeof TypeStateAnnotation.State) {
  const toolNode = new ToolNode(typeTools);
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
  };
}

// Router function - decides whether to continue to tools or end
function shouldContinue(state: typeof TypeStateAnnotation.State): string {
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
const typeWorkflow = new StateGraph(TypeStateAnnotation)
  .addNode("type", typeNode)
  .addNode("tools", typeToolsNode)
  .addEdge(START, "type")
  .addConditionalEdges("type", shouldContinue, {
    tools: "tools",
    END: END,
  })
  .addEdge("tools", "type");

// Compile the graph
const typeGraph = typeWorkflow.compile();

// Create the subagent tool wrapper
const subagentTypeSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The type-related task to perform"),
});

export const subagentTypeTool = tool(
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

    console.log('[subagent-type] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await typeGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-type",
    description:
      "Delegate type-related tasks to the type subagent. Use this when you need to read or write TypeScript type definitions.",
    schema: subagentTypeSchema,
  }
);
