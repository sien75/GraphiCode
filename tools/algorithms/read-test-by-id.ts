import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AlgorithmConfig } from "types";

const readTestByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read test for"),
});

// Core function that can be called directly
export async function readTestById(
  path: string,
  id: string
): Promise<{
  config: AlgorithmConfig;
  testFile: string;
}> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");
  const testFilePath = join(algorithmFolderPath, "index.test.ts");

  let config = null;
  let testFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for algorithm ${id}: ${error}`);
  }

  // Read index.test.ts
  try {
    const file = Bun.file(testFilePath);
    testFile = await file.text();
  } catch (error) {
    console.error(`Failed to read index.test.ts for algorithm ${id}: ${error}`);
  }

  return {
    config,
    testFile,
  };
}

// LangChain tool wrapper
export const readTestByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readTestById(input.workspacePath, input.id);
  },
  {
    name: "read_test_by_id",
    description:
      "Read the test file (index.test.ts) and config.json for a specific algorithm by its ID (folder name) from src/algorithms/{id}/ folder. Returns both config (with runtimeEnv info) and test file content.",
    schema: readTestByIdSchema,
  }
);

