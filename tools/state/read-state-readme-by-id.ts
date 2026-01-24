import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";

const readStateReadmeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to read"),
});

// Core function that can be called directly
export async function readStateReadmeById(
  path: string,
  id: string
): Promise<string> {
  const stateFolderPath = join(path, "src", "states", id);
  const readmePath = join(stateFolderPath, "README.md");

  // Read README.md
  try {
    const file = Bun.file(readmePath);
    return await file.text();
  } catch (error) {
    console.error(`Failed to read README.md for state ${id}: ${error}`);
    return "";
  }
}

// LangChain tool wrapper
export const readStateReadmeByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readStateReadmeById(input.workspacePath, input.id);
  },
  {
    name: "read-state-readme-by-id",
    description:
      "Read the README.md of a specific state by its ID (folder name). Returns the README.md content from src/states/{id}/ folder.",
    schema: readStateReadmeByIdSchema,
  }
);
