import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { getMainFileName } from "../_get-file-name-of-env";

const readAlgorithmCodeByIdSchema = z.object({
  language: z.string().describe("Language (e.g., 'TypeScript')"),
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read"),
});

// Core function that can be called directly
export async function readAlgorithmCodeById(
  language: string,
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<string> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);

  // Get the main file name from config
  const mainFileName = getMainFileName(language, devEnv, runtimeEnv);
  const mainFilePath = join(algorithmFolderPath, mainFileName);

  // Read main file
  try {
    const file = Bun.file(mainFilePath);
    return await file.text();
  } catch (error) {
    console.error(
      `Failed to read ${mainFileName} for algorithm ${id}: ${error}`
    );
    return "";
  }
}

// LangChain tool wrapper
export const readAlgorithmCodeByIdTool = tool(
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
    return await readAlgorithmCodeById(
      input.language,
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read-algorithm-code-by-id",
    description:
      "Read the code file of a specific algorithm by its ID (folder name). Returns the main file content from src/algorithms/{id}/ folder. The main file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readAlgorithmCodeByIdSchema,
  }
);
