import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { FlowsConfig } from "types";

const readAllFlowsSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllFlows(path: string): Promise<FlowsConfig> {
  const configPath = join(path, "src", "flows", "config.json");

  try {
    const config: FlowsConfig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read flows config.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      description: "",
      flows: [],
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
      "Read all flows from src/flows/config.json. Returns the config.json content which includes description and flows array with id and runtimeEnv.",
    schema: readAllFlowsSchema,
  }
);

