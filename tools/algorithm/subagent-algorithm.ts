import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { algorithmNode } from "../../nodes/algorithm";
import { readAllAlgorithmsTool } from "./read-all-algorithms";
import { readAlgorithmByIdTool } from "./read-algorithm-by-id";
import { writeAlgorithmByIdTool } from "./write-algorithm-by-id";
import { readTestByIdTool } from "./read-test-by-id";
import { writeTestByIdTool } from "./write-test-by-id";
import { executeTestByIdTool } from "./execute-test-by-id";

// Algorithm tools for this subagent
const algorithmTools = [
  readAllAlgorithmsTool,
  readAlgorithmByIdTool,
  writeAlgorithmByIdTool,
  readTestByIdTool,
  writeTestByIdTool,
  executeTestByIdTool,
];

// Define state annotation for the algorithm subagent
const AlgorithmStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Tools node - handles tool calls
async function algorithmToolsNode(state: typeof AlgorithmStateAnnotation.State) {
  const toolNode = new ToolNode(algorithmTools);
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
  };
}

// Router function - decides whether to continue to tools or end
function shouldContinue(state: typeof AlgorithmStateAnnotation.State): string {
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
const algorithmWorkflow = new StateGraph(AlgorithmStateAnnotation)
  .addNode("algorithm", algorithmNode)
  .addNode("tools", algorithmToolsNode)
  .addEdge(START, "algorithm")
  .addConditionalEdges("algorithm", shouldContinue, {
    tools: "tools",
    END: END,
  })
  .addEdge("tools", "algorithm");

// Compile the graph
const algorithmGraph = algorithmWorkflow.compile();

// Create the subagent tool wrapper
const subagentAlgorithmSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The algorithm-related task to perform"),
});

export const subagentAlgorithmTool = tool(
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

    console.log('[subagent-algorithm] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await algorithmGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-algorithm",
    description:
      "Delegate algorithm-related tasks to the algorithm subagent. Use this when you need to read, write, test, or execute algorithms.",
    schema: subagentAlgorithmSchema,
  }
);
