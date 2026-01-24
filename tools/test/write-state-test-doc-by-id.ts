import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";

const writeStateTestDocByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to write test doc for"),
  content: z.string().describe("New TEST.md file content"),
});

// Core function that can be called directly
export async function writeStateTestDocById(
  path: string,
  id: string,
  content: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const stateFolderPath = join(path, "src", "states", id);
  const testDocPath = join(stateFolderPath, "TEST.md");
  const updatedFiles: string[] = [];

  // Ensure the state folder exists
  try {
    await mkdir(stateFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create state folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write TEST.md
  try {
    await Bun.write(testDocPath, content);
    updatedFiles.push(`src/states/${id}/TEST.md`);
  } catch (error) {
    console.error(`Failed to write TEST.md for state ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeStateTestDocByIdTool = tool(
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
    return await writeStateTestDocById(
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-state-test-doc-by-id",
    description:
      "Write or update the TEST.md documentation of a specific state by its ID. Creates the folder if it doesn't exist and writes the content to TEST.md file.",
    schema: writeStateTestDocByIdSchema,
  }
);
