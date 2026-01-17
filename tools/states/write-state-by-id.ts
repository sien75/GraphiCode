import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import type { RuntimeEnv } from "types";

const writeStateByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to write"),
  newConfig: z
    .object({
      description: z.string().describe("Description of the state folder"),
      stateDetail: z
        .record(
          z.string(),
          z.object({
            runtimeEnv: z
              .enum(["Bun", "Browser"])
              .describe("Runtime environment for this state"),
            content: z.string().describe("Content description of the state"),
          })
        )
        .describe(
          "Object mapping state names to their runtime environment and content description"
        ),
    })
    .optional()
    .describe(
      "New config.json content. If undefined or null, config.json will not be modified"
    ),
  newStateFile: z
    .string()
    .optional()
    .describe(
      "New state.ts file content. If undefined or null, state.ts will not be modified"
    ),
});

// Core function that can be called directly
export async function writeStateById(
  path: string,
  id: string,
  newConfig?: {
    description: string;
    stateDetail: {
      [stateName: string]: {
        runtimeEnv: RuntimeEnv;
        content: string;
      };
    };
  } | null,
  newStateFile?: string | null
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const stateFolderPath = join(path, "src", "states", id);
  const configPath = join(stateFolderPath, "config.json");
  const stateFilePath = join(stateFolderPath, "state.ts");
  const updatedFiles: string[] = [];

  // Ensure the state folder exists if we need to write anything
  if (newConfig || newStateFile) {
    try {
      await mkdir(stateFolderPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create state folder ${id}: ${error}`);
      return { success: false, updatedFiles: [] };
    }
  }

  // Write config.json only if newConfig is provided
  if (newConfig !== undefined && newConfig !== null) {
    try {
      await Bun.write(configPath, JSON.stringify(newConfig, null, 2));
      updatedFiles.push(`src/states/${id}/config.json`);
    } catch (error) {
      console.error(`Failed to write config.json for state ${id}: ${error}`);
    }
  }

  // Write state.ts only if newStateFile is provided
  if (newStateFile !== undefined && newStateFile !== null) {
    try {
      await Bun.write(stateFilePath, newStateFile);
      updatedFiles.push(`src/states/${id}/state.ts`);
    } catch (error) {
      console.error(`Failed to write state.ts for state ${id}: ${error}`);
    }
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeStateByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await writeStateById(
      input.workspacePath,
      input.id,
      input.newConfig,
      input.newStateFile
    );
  },
  {
    name: "write_state_by_id",
    description:
      "Write or update a specific state by its ID. Creates the folder if it doesn't exist. Only updates the files for which data is provided (newConfig for config.json, newStateFile for state.ts).",
    schema: writeStateByIdSchema,
  }
);

