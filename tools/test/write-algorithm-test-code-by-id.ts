import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import { getTestFileName } from "../_get-file-name-of-env";

const writeAlgorithmTestCodeByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to write test code for"),
  content: z.string().describe("New test file content"),
});

// Core function that can be called directly
export async function writeAlgorithmTestCodeById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string,
  content: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);

  // Get the test file name from config
  const testFileName = getTestFileName(devEnv, runtimeEnv);
  const testFilePath = join(algorithmFolderPath, testFileName);

  const updatedFiles: string[] = [];

  // Ensure the algorithm folder exists
  try {
    await mkdir(algorithmFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create algorithm folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write test file
  try {
    await Bun.write(testFilePath, content);
    updatedFiles.push(`src/algorithms/${id}/${testFileName}`);
  } catch (error) {
    console.error(
      `Failed to write ${testFileName} for algorithm ${id}: ${error}`
    );
    return { success: false, updatedFiles: [] };
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeAlgorithmTestCodeByIdTool = tool(
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
    if (!input.content) {
      throw new Error("content is required");
    }
    return await writeAlgorithmTestCodeById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-algorithm-test-code-by-id",
    description:
      "Write or update the test code file of a specific algorithm by its ID. Creates the folder if it doesn't exist and writes the content to the test file. The test file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: writeAlgorithmTestCodeByIdSchema,
  }
);
