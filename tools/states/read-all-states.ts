import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { StatesConfig } from "types";

const readAllStatesSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllStates(path: string): Promise<StatesConfig> {
  const configPath = join(path, "src", "states", "config.json");

  try {
    const config: StatesConfig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read states config.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      description: "",
      states: [],
    };
  }
}

// LangChain tool wrapper
export const readAllStatesTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    return await readAllStates(input.workspacePath);
  },
  {
    name: "read_all_states",
    description:
      "Read all states from src/states/config.json. Returns the config.json content which includes description and states array with id and runtimeEnv.",
    schema: readAllStatesSchema,
  }
);

