import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { getTestFileName } from "../_get-file-name-of-env";

const readAlgorithmTestCodeByIdSchema = z.object({
  language: z.string().describe("Language (e.g., 'TypeScript')"),
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read test code for"),
});

// Core function that can be called directly
export async function readAlgorithmTestCodeById(
  language: string,
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<string> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);

  // Get the test file name from config
  const testFileName = getTestFileName(language, devEnv, runtimeEnv);
  const testFilePath = join(algorithmFolderPath, testFileName);

  // Read test file
  try {
    const file = Bun.file(testFilePath);
    return await file.text();
  } catch (error) {
    console.error(
      `Failed to read ${testFileName} for algorithm ${id}: ${error}`
    );
    return "";
  }
}

// LangChain tool wrapper
export const readAlgorithmTestCodeByIdTool = tool(
  async (input) => {
    if (!input.language) {
      throw new Error("language is required");
    }
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
    return await readAlgorithmTestCodeById(
      input.language,
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read-algorithm-test-code-by-id",
    description:
      "Read the test code file of a specific algorithm by its ID (folder name). Returns the test file content from src/algorithms/{id}/ folder. The test file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readAlgorithmTestCodeByIdSchema,
  }
);
