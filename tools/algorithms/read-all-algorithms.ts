import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AlgorithmsConfig } from "types";

const readAllAlgorithmsSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllAlgorithms(
  path: string
): Promise<AlgorithmsConfig> {
  const configPath = join(path, "src", "algorithms", "config.json");

  try {
    const config: AlgorithmsConfig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read algorithms config.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      description: "",
      algorithms: [],
    };
  }
}

// LangChain tool wrapper
export const readAllAlgorithmsTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    return await readAllAlgorithms(input.workspacePath);
  },
  {
    name: "read_all_algorithms",
    description:
      "Read all algorithms from src/algorithms/config.json. Returns the config.json content which includes description and algorithms array with id and runtimeEnv.",
    schema: readAllAlgorithmsSchema,
  }
);

