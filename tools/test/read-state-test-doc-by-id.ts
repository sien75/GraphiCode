import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";

const readStateTestDocByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The state ID (folder name) to read test doc for"),
});

// Core function that can be called directly
export async function readStateTestDocById(
  path: string,
  id: string
): Promise<string> {
  const stateFolderPath = join(path, "src", "states", id);
  const testDocPath = join(stateFolderPath, "TEST.md");

  // Read TEST.md
  try {
    const file = Bun.file(testDocPath);
    return await file.text();
  } catch (error) {
    console.error(`Failed to read TEST.md for state ${id}: ${error}`);
    return "";
  }
}

// LangChain tool wrapper
export const readStateTestDocByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readStateTestDocById(input.workspacePath, input.id);
  },
  {
    name: "read-state-test-doc-by-id",
    description:
      "Read the TEST.md documentation of a specific state by its ID (folder name). Returns the TEST.md content from src/states/{id}/ folder.",
    schema: readStateTestDocByIdSchema,
  }
);
