import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { StateConfig } from "types";
import { getMainFileName } from "../_utils";

const readStateByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the state"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to read"),
});

// Core function that can be called directly
export async function readStateById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string
): Promise<{
  config: StateConfig;
  stateFile: string;
}> {
  const stateFolderPath = join(workspacePath, "src", "states", id);
  const configPath = join(stateFolderPath, "config.json");

  let config = null;
  let stateFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for state ${id}: ${error}`);
  }

  // Get the main file name from config
  const mainFileName = getMainFileName(devEnv, runtimeEnv);
  const mainFilePath = join(stateFolderPath, mainFileName);

  // Read main file
  try {
    const file = Bun.file(mainFilePath);
    stateFile = await file.text();
  } catch (error) {
    console.error(
      `Failed to read ${mainFileName} for state ${id}: ${error}`
    );
  }

  return {
    config,
    stateFile,
  };
}

// LangChain tool wrapper
export const readStateByIdTool = tool(
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
    return await readStateById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id
    );
  },
  {
    name: "read_state_by_id",
    description:
      "Read a specific state by its ID (folder name). Returns both config.json and main file content from src/states/{id}/ folder. The main file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: readStateByIdSchema,
  }
);

