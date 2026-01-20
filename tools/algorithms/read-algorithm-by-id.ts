import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AlgorithmConfig } from "types";
import { getMainFileName } from "./_utils";

const readAlgorithmByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read"),
});

// Core function that can be called directly
export async function readAlgorithmById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<{
  config: AlgorithmConfig;
  algorithmFile: string;
}> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");

  let config = null;
  let algorithmFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for algorithm ${id}: ${error}`);
  }

  // Get the main file name from config
  const mainFileName = getMainFileName(devEnv, runtimeEnv);
  const mainFilePath = join(algorithmFolderPath, mainFileName);

  // Read main file
  try {
    const file = Bun.file(mainFilePath);
    algorithmFile = await file.text();
  } catch (error) {
    console.error(
      `Failed to read ${mainFileName} for algorithm ${id}: ${error}`
    );
  }

  return {
    config,
    algorithmFile,
  };
}

// LangChain tool wrapper
export const readAlgorithmByIdTool = tool(
  async (input) => {
    if (!input.devEnv) {
      throw new Error("devEnv is required");
    }
    if (!input.runtimeEnv) {
      throw new Error("runtimeEnv is required");
    }
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readAlgorithmById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read_algorithm_by_id",
    description:
      "Read a specific algorithm by its ID (folder name). Returns both config.json and main file content from src/algorithms/{id}/ folder. The main file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readAlgorithmByIdSchema,
  }
);

