import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import { safeReadWrite } from "../_concurrent-write-file";
import type { AlgorithmGraphig } from "types";

const writeAlgorithmReadmeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to write"),
  content: z.string().describe("New README.md file content"),
  description: z
    .string()
    .describe("Description of the algorithm (required, for graphig.json)"),
});

// Core function that can be called directly
export async function writeAlgorithmReadmeById(
  path: string,
  id: string,
  content: string,
  description: string
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

  // Update algorithm.graphig.json - only update description
  const graphigPath = join(path, "src", "algorithms", "algorithm.graphig.json");
  try {
    await safeReadWrite(graphigPath, (content) => {
      let config: AlgorithmGraphig = { algorithms: {} };
      try {
        config = JSON.parse(content);
      } catch (error) {
        console.log(`algorithm.graphig.json doesn't exist, creating new one`);
      }

      const existingEntry = config.algorithms[id];
      if (existingEntry) {
        existingEntry.description = description;
      } else {
        config.algorithms[id] = { description } as any;
      }

      return JSON.stringify(config, null, 2);
    });
    updatedFiles.push(`src/algorithms/algorithm.graphig.json`);
  } catch (error) {
    console.error(`Failed to update algorithm.graphig.json: ${error}`);
    return { success: false, updatedFiles };
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
    if (!input.description) {
      throw new Error("description is required");
    }
    return await writeAlgorithmReadmeById(
      input.workspacePath,
      input.id,
      input.content,
      input.description
    );
  },
  {
    name: "write-algorithm-readme-by-id",
    description:
      "Write or update the README.md of a specific algorithm by its ID. Creates the folder if it doesn't exist and writes the content to README.md file. Also updates algorithm.graphig.json with the description.",
    schema: writeAlgorithmReadmeByIdSchema,
  }
);
