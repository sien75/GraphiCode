import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";

const writeStateReadmeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to write"),
  content: z.string().describe("New README.md file content"),
});

// Core function that can be called directly
export async function writeStateReadmeById(
  path: string,
  id: string,
  content: string
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
    return await writeStateReadmeById(
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-state-readme-by-id",
    description:
      "Write or update the README.md of a specific state by its ID. Creates the folder if it doesn't exist and writes the content to README.md file.",
    schema: writeStateReadmeByIdSchema,
  }
);
