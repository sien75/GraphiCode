import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { FlowGraphig } from "types";

const readAllFlowsSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllFlows(path: string): Promise<FlowGraphig> {
  const configPath = join(path, "src", "flows", "flow.graphig.json");

  try {
    const config: FlowGraphig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read flow.graphig.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      flows: {},
    };
  }
}

// LangChain tool wrapper
export const readAllFlowsTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    return await readAllFlows(input.workspacePath);
  },
  {
    name: "read-all-flows",
    description:
      "Read all flows from src/flows/flow.graphig.json. Returns the flow.graphig.json content which includes flows object mapping flowId to description.",
    schema: readAllFlowsSchema,
  }
);

