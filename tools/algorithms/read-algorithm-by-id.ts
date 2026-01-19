import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AlgorithmConfig } from "types";

const readAlgorithmByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read"),
});

// Core function that can be called directly
export async function readAlgorithmById(
  path: string,
  id: string
): Promise<{
  config: AlgorithmConfig;
  algorithmFile: string;
}> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");
  const algorithmFilePath = join(algorithmFolderPath, "algorithm.ts");

  let config = null;
  let algorithmFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for algorithm ${id}: ${error}`);
  }

  // Read algorithm.ts
  try {
    const file = Bun.file(algorithmFilePath);
    algorithmFile = await file.text();
  } catch (error) {
    console.error(`Failed to read algorithm.ts for algorithm ${id}: ${error}`);
  }

  return {
    config,
    algorithmFile,
  };
}

// LangChain tool wrapper
export const readAlgorithmByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readAlgorithmById(input.workspacePath, input.id);
  },
  {
    name: "read_algorithm_by_id",
    description:
      "Read a specific algorithm by its ID (folder name). Returns both config.json and algorithm.ts content from src/algorithms/{id}/ folder.",
    schema: readAlgorithmByIdSchema,
  }
);

