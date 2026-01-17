import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { StateConfig } from "types";

const readStateByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to read"),
});

// Core function that can be called directly
export async function readStateById(
  path: string,
  id: string
): Promise<{
  config: StateConfig;
  stateFile: string;
}> {
  const stateFolderPath = join(path, "src", "states", id);
  const configPath = join(stateFolderPath, "config.json");
  const stateFilePath = join(stateFolderPath, "state.ts");

  let config = null;
  let stateFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for state ${id}: ${error}`);
  }

  // Read state.ts
  try {
    const file = Bun.file(stateFilePath);
    stateFile = await file.text();
  } catch (error) {
    console.error(`Failed to read state.ts for state ${id}: ${error}`);
  }

  return {
    config,
    stateFile,
  };
}

// LangChain tool wrapper
export const readStateByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readStateById(input.workspacePath, input.id);
  },
  {
    name: "read_state_by_id",
    description:
      "Read a specific state by its ID (folder name). Returns both config.json and state.ts content from src/states/{id}/ folder.",
    schema: readStateByIdSchema,
  }
);

