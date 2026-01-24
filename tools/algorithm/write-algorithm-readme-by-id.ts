import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";

const writeAlgorithmReadmeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to write"),
  content: z.string().describe("New README.md file content"),
});

// Core function that can be called directly
export async function writeAlgorithmReadmeById(
  path: string,
  id: string,
  content: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const readmePath = join(algorithmFolderPath, "README.md");
  const updatedFiles: string[] = [];

  // Ensure the algorithm folder exists
  try {
    await mkdir(algorithmFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create algorithm folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write README.md
  try {
    await Bun.write(readmePath, content);
    updatedFiles.push(`src/algorithms/${id}/README.md`);
  } catch (error) {
    console.error(`Failed to write README.md for algorithm ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeAlgorithmReadmeByIdTool = tool(
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
    return await writeAlgorithmReadmeById(
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-algorithm-readme-by-id",
    description:
      "Write or update the README.md of a specific algorithm by its ID. Creates the folder if it doesn't exist and writes the content to README.md file.",
    schema: writeAlgorithmReadmeByIdSchema,
  }
);
