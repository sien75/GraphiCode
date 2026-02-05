import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { getMainFileName } from "../_get-file-name-of-env";

const readStateCodeByIdSchema = z.object({
  language: z.string().describe("Language (e.g., 'TypeScript')"),
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the state"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to read"),
});

// Core function that can be called directly
export async function readStateCodeById(
  language: string,
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<string> {
  const stateFolderPath = join(workspacePath, "src", "states", id);

  // Get the main file name from config
  const mainFileName = getMainFileName(language, devEnv, runtimeEnv);
  const mainFilePath = join(stateFolderPath, mainFileName);

  // Read main file
  try {
    const file = Bun.file(mainFilePath);
    return await file.text();
  } catch (error) {
    console.error(
      `Failed to read ${mainFileName} for state ${id}: ${error}`
    );
    return "";
  }
}

// LangChain tool wrapper
export const readStateCodeByIdTool = tool(
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
    return await readStateCodeById(
      input.language,
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read-state-code-by-id",
    description:
      "Read the code file of a specific state by its ID (folder name). Returns the main file content from src/states/{id}/ folder. The main file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readStateCodeByIdSchema,
  }
);
