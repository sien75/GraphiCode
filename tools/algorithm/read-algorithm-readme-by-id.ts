import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";

const readAlgorithmReadmeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to read"),
});

// Core function that can be called directly
export async function readAlgorithmReadmeById(
  path: string,
  id: string
): Promise<string> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const readmePath = join(algorithmFolderPath, "README.md");

  // Read README.md
  try {
    const file = Bun.file(readmePath);
    return await file.text();
  } catch (error) {
    console.error(`Failed to read README.md for algorithm ${id}: ${error}`);
    return "";
  }
}

// LangChain tool wrapper
export const readAlgorithmReadmeByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readAlgorithmReadmeById(input.workspacePath, input.id);
  },
  {
    name: "read-algorithm-readme-by-id",
    description:
      "Read the README.md of a specific algorithm by its ID (folder name). Returns the README.md content from src/algorithms/{id}/ folder.",
    schema: readAlgorithmReadmeByIdSchema,
  }
);
