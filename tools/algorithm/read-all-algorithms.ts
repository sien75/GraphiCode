import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AlgorithmGraphig } from "types";

const readAllAlgorithmsSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllAlgorithms(
  path: string
): Promise<AlgorithmGraphig> {
  const configPath = join(path, "src", "algorithms", "algorithm.graphig.json");

  try {
    const config: AlgorithmGraphig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read algorithm.graphig.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      algorithms: {},
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
    name: "read-all-algorithms",
    description:
      "Read all algorithms from src/algorithms/algorithm.graphig.json. Returns the algorithm.graphig.json content which includes runtimeEnv and algorithms object mapping algorithmId to description.",
    schema: readAllAlgorithmsSchema,
  }
);
