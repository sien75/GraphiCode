import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { StateGraphig } from "types";

const readAllStatesSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllStates(path: string): Promise<StateGraphig> {
  const configPath = join(path, "src", "states", "state.graphig.json");

  try {
    const config: StateGraphig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read state.graphig.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      states: {},
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
    name: "read-all-states",
    description:
      "Read all states from src/states/state.graphig.json. Returns the state.graphig.json content which includes states object mapping stateId to description and runtimeEnv.",
    schema: readAllStatesSchema,
  }
);

