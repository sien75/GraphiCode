import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { analyzerNode } from "../../nodes/analyzer";

// Analyzer doesn't need specific tools, it just analyzes requirements

// Define state annotation for the analyzer subagent
const AnalyzerStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  types: Annotation<any[]>(),
  states: Annotation<any[]>(),
  algorithms: Annotation<any[]>(),
  flows: Annotation<any[]>(),
  workspacePath: Annotation<string>(),
  appInfo: Annotation<any>(),
});

// Router function - analyzer always ends after processing
function shouldContinue(state: typeof AnalyzerStateAnnotation.State): string {
  // Analyzer node just processes and ends, no tools needed
  return 'END';
}

// Build the graph
const analyzerWorkflow = new StateGraph(AnalyzerStateAnnotation)
  .addNode("analyzer", analyzerNode)
  .addEdge(START, "analyzer")
  .addConditionalEdges("analyzer", shouldContinue, {
    END: END,
  });

// Compile the graph
const analyzerGraph = analyzerWorkflow.compile();

// Create the subagent tool wrapper
const subagentAnalyzerSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  task: z.string().describe("The product requirement to analyze"),
});

export const subagentAnalyzerTool = tool(
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

    console.log('[subagent-analyzer] debug', initialState);

    return 'Task completed.';

    // Run the graph
    // const result = await analyzerGraph.invoke(initialState);

    // // Return the final message
    // const finalMessage = result.messages[result.messages.length - 1];
    // if (finalMessage && finalMessage.content) {
    //   return "Task completed.\n" + finalMessage.content;
    // }

    // return "Task failed";
  },
  {
    name: "subagent-analyzer",
    description:
      "Delegate product requirements analysis to the analyzer subagent. Use this when you need to break down product requirements into technical tasks (types, states, algorithms, flows).",
    schema: subagentAnalyzerSchema,
  }
);
