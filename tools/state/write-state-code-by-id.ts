import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import { getMainFileName } from "../_utils";
import type { StateGraphig, RuntimeEnv } from "types";

const writeStateCodeByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the state"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to write"),
  content: z.string().describe("New main file content"),
});

// Core function that can be called directly
export async function writeStateCodeById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string,
  content: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const stateFolderPath = join(workspacePath, "src", "states", id);

  // Get the main file name from config
  const mainFileName = getMainFileName(devEnv, runtimeEnv);
  const mainFilePath = join(stateFolderPath, mainFileName);

  const updatedFiles: string[] = [];

  // Ensure the state folder exists
  try {
    await mkdir(stateFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create state folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write main file
  try {
    await Bun.write(mainFilePath, content);
    updatedFiles.push(`src/states/${id}/${mainFileName}`);
  } catch (error) {
    console.error(
      `Failed to write ${mainFileName} for state ${id}: ${error}`
    );
    return { success: false, updatedFiles: [] };
  }

  // Update state.graphig.json - only update runtimeEnv
  const graphigPath = join(workspacePath, "src", "states", "state.graphig.json");
  try {
    // Read existing config
    let config: StateGraphig = { states: {} };
    try {
      config = await Bun.file(graphigPath).json();
    } catch (error) {
      // File doesn't exist yet, use default structure
      console.log(`state.graphig.json doesn't exist, creating new one`);
    }

    // Update or add the state entry - preserve existing description if exists
    const existingEntry = config.states[id];
    config.states[id] = {
      description: existingEntry?.description || "",
      runtimeEnv: runtimeEnv as RuntimeEnv,
    };

    // Write back the config
    await Bun.write(graphigPath, JSON.stringify(config, null, 2));
    updatedFiles.push(`src/states/state.graphig.json`);
  } catch (error) {
    console.error(`Failed to update state.graphig.json: ${error}`);
    return { success: false, updatedFiles };
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeStateCodeByIdTool = tool(
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
    return await writeStateCodeById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-state-code-by-id",
    description:
      "Write or update the code file of a specific state by its ID. Creates the folder if it doesn't exist and writes the content to the main file. The main file name is determined from config/main.json based on devEnv and runtimeEnv. Also updates state.graphig.json with the runtimeEnv.",
    schema: writeStateCodeByIdSchema,
  }
);
