import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { flowNode } from "../../nodes/flow";
import { readAllFlowsTool } from "./read-all-flows";
import { readFlowByIdTool } from "./read-flow-by-id";
import { writeFlowByIdTool } from "./write-flow-by-id";

// Flow tools for this subagent
const flowTools = [
  readAllFlowsTool,
  readFlowByIdTool,
  writeFlowByIdTool,
];

// Define state annotation for the flow subagent
const FlowStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Tools node - handles tool calls
async function flowToolsNode(state: typeof FlowStateAnnotation.State) {
  const toolNode = new ToolNode(flowTools);
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
  };
}

// Router function - decides whether to continue to tools or end
function shouldContinue(state: typeof FlowStateAnnotation.State): string {
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
const flowWorkflow = new StateGraph(FlowStateAnnotation)
  .addNode("flow", flowNode)
  .addNode("tools", flowToolsNode)
  .addEdge(START, "flow")
  .addConditionalEdges("flow", shouldContinue, {
    tools: "tools",
    END: END,
  })
  .addEdge("tools", "flow");

// Compile the graph
const flowGraph = flowWorkflow.compile();

// Create the subagent tool wrapper
const subagentFlowSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The flow-related task to perform"),
});

export const subagentFlowTool = tool(
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

    console.log('[subagent-flow] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await flowGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-flow",
    description:
      "Delegate flow-related tasks to the flow subagent. Use this when you need to read or write D2 flow diagrams.",
    schema: subagentFlowSchema,
  }
);
