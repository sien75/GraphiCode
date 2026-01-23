import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { stateNode } from "../../nodes/state";
import { readAllStatesTool } from "./read-all-states";
import { readStateByIdTool } from "./read-state-by-id";
import { writeStateByIdTool } from "./write-state-by-id";

// State tools for this subagent
const stateTools = [
  readAllStatesTool,
  readStateByIdTool,
  writeStateByIdTool,
];

// Define state annotation for the state subagent
const StateStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Tools node - handles tool calls
async function stateToolsNode(state: typeof StateStateAnnotation.State) {
  const toolNode = new ToolNode(stateTools);
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
  };
}

// Router function - decides whether to continue to tools or end
function shouldContinue(state: typeof StateStateAnnotation.State): string {
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
const stateWorkflow = new StateGraph(StateStateAnnotation)
  .addNode("state", stateNode)
  .addNode("tools", stateToolsNode)
  .addEdge(START, "state")
  .addConditionalEdges("state", shouldContinue, {
    tools: "tools",
    END: END,
  })
  .addEdge("tools", "state");

// Compile the graph
const stateGraph = stateWorkflow.compile();

// Create the subagent tool wrapper
const subagentStateSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The state-related task to perform"),
});

export const subagentStateTool = tool(
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

    console.log('[subagent-state] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await stateGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-state",
    description:
      "Delegate state-related tasks to the state subagent. Use this when you need to read or write state definitions.",
    schema: subagentStateSchema,
  }
);
