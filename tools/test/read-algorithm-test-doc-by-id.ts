import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";

const readAlgorithmTestDocByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read test doc for"),
});

// Core function that can be called directly
export async function readAlgorithmTestDocById(
  path: string,
  id: string
): Promise<string> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const testDocPath = join(algorithmFolderPath, "TEST.md");

  // Read TEST.md
  try {
    const file = Bun.file(testDocPath);
    return await file.text();
  } catch (error) {
    console.error(`Failed to read TEST.md for algorithm ${id}: ${error}`);
    return "";
  }
}

// LangChain tool wrapper
export const readAlgorithmTestDocByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readAlgorithmTestDocById(input.workspacePath, input.id);
  },
  {
    name: "read-algorithm-test-doc-by-id",
    description:
      "Read the TEST.md documentation of a specific algorithm by its ID (folder name). Returns the TEST.md content from src/algorithms/{id}/ folder.",
    schema: readAlgorithmTestDocByIdSchema,
  }
);
