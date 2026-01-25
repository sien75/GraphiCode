import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import { safeReadWrite } from "../_concurrent-write-file";
import type { StateGraphig } from "types";

const writeStateReadmeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to write"),
  content: z.string().describe("New README.md file content"),
  description: z
    .string()
    .describe("Description of the state (required, for graphig.json)"),
});

// Core function that can be called directly
export async function writeStateReadmeById(
  path: string,
  id: string,
  content: string,
  description: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const stateFolderPath = join(path, "src", "states", id);
  const readmePath = join(stateFolderPath, "README.md");
  const updatedFiles: string[] = [];

  // Ensure the state folder exists
  try {
    await mkdir(stateFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create state folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write README.md
  try {
    await Bun.write(readmePath, content);
    updatedFiles.push(`src/states/${id}/README.md`);
  } catch (error) {
    console.error(`Failed to write README.md for state ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Update state.graphig.json - only update description
  const graphigPath = join(path, "src", "states", "state.graphig.json");
  try {
    await safeReadWrite(graphigPath, (content) => {
      let config: StateGraphig = { states: {} };
      try {
        config = JSON.parse(content);
      } catch (error) {
        console.log(`state.graphig.json doesn't exist, creating new one`);
      }

      const existingEntry = config.states[id];
      if (existingEntry) {
        existingEntry.description = description;
      } else {
        config.states[id] = { description } as any;
      }

      return JSON.stringify(config, null, 2);
    });
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
export const writeStateReadmeByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    if (!input.content) {
      throw new Error("content is required");
    }
    if (!input.description) {
      throw new Error("description is required");
    }
    return await writeStateReadmeById(
      input.workspacePath,
      input.id,
      input.content,
      input.description
    );
  },
  {
    name: "write-state-readme-by-id",
    description:
      "Write or update the README.md of a specific state by its ID. Creates the folder if it doesn't exist and writes the content to README.md file. Also updates state.graphig.json with the description.",
    schema: writeStateReadmeByIdSchema,
  }
);
