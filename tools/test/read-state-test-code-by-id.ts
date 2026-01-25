import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { getTestFileName } from "../_get-file-name-of-env";

const readStateTestCodeByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the state"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to read test code for"),
});

// Core function that can be called directly
export async function readStateTestCodeById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<string> {
  const stateFolderPath = join(workspacePath, "src", "states", id);

  // Get the test file name from config
  const testFileName = getTestFileName(devEnv, runtimeEnv);
  const testFilePath = join(stateFolderPath, testFileName);

  // Read test file
  try {
    const file = Bun.file(testFilePath);
    return await file.text();
  } catch (error) {
    console.error(
      `Failed to read ${testFileName} for state ${id}: ${error}`
    );
    return "";
  }
}

// LangChain tool wrapper
export const readStateTestCodeByIdTool = tool(
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
    return await readStateTestCodeById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read-state-test-code-by-id",
    description:
      "Read the test code file of a specific state by its ID (folder name). Returns the test file content from src/states/{id}/ folder. The test file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readStateTestCodeByIdSchema,
  }
);
