import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { testNode } from "../../nodes/test";
import { readTestByIdTool } from "./read-test-by-id";
import { writeTestByIdTool } from "./write-test-by-id";
import { executeTestByIdTool } from "./execute-test-by-id";

// Test tools for this subagent
const testTools = [
  readTestByIdTool,
  writeTestByIdTool,
  executeTestByIdTool,
];

// Define state annotation for the test subagent
const TestStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Tools node - handles tool calls
async function testToolsNode(state: typeof TestStateAnnotation.State) {
  const toolNode = new ToolNode(testTools);
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
  };
}

// Router function - decides whether to continue to tools or end
function shouldContinue(state: typeof TestStateAnnotation.State): string {
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
const testWorkflow = new StateGraph(TestStateAnnotation)
  .addNode("test", testNode)
  .addNode("tools", testToolsNode)
  .addEdge(START, "test")
  .addConditionalEdges("test", shouldContinue, {
    tools: "tools",
    END: END,
  })
  .addEdge("tools", "test");

// Compile the graph
const testGraph = testWorkflow.compile();

// Create the subagent tool wrapper
const subagentTestSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The test-related task to perform"),
});

export const subagentTestTool = tool(
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

    console.log('[subagent-test] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await testGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-test",
    description:
      "Delegate test-related tasks to the test subagent. Use this when you need to read, write, or execute tests.",
    schema: subagentTestSchema,
  }
);
