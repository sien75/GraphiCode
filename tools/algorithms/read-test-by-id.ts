import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AlgorithmConfig } from "types";
import { getTestFileName } from "../_utils";

const readTestByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read test for"),
});

// Core function that can be called directly
export async function readTestById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<{
  config: AlgorithmConfig;
  testFile: string;
}> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");

  let config = null;
  let testFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for algorithm ${id}: ${error}`);
  }

  // Get the test file name from config
  const testFileName = getTestFileName(devEnv, runtimeEnv);
  const testFilePath = join(algorithmFolderPath, testFileName);

  // Read test file
  try {
    const file = Bun.file(testFilePath);
    testFile = await file.text();
  } catch (error) {
    console.error(`Failed to read test file for algorithm ${id}: ${error}`);
  }

  return {
    config,
    testFile,
  };
}

// LangChain tool wrapper
export const readTestByIdTool = tool(
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
    return await readTestById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read_test_by_id",
    description:
      "Read the test file and config.json for a specific algorithm by its ID (folder name) from src/algorithms/{id}/ folder. Returns both config (with runtimeEnv info) and test file content. The test file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readTestByIdSchema,
  }
);

