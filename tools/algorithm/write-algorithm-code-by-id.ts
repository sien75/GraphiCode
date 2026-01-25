import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import { getMainFileName } from "../_get-file-name-of-env";
import { safeReadWrite } from "../_concurrent-write-file";
import type { AlgorithmGraphig, RuntimeEnv } from "types";

const writeAlgorithmCodeByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to write"),
  content: z.string().describe("New main file content"),
});

// Core function that can be called directly
export async function writeAlgorithmCodeById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
  id: string,
  content: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);

  // Get the main file name from config
  const mainFileName = getMainFileName(devEnv, runtimeEnv);
  const mainFilePath = join(algorithmFolderPath, mainFileName);

  const updatedFiles: string[] = [];

  // Ensure the algorithm folder exists
  try {
    await mkdir(algorithmFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create algorithm folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write main file
  try {
    await Bun.write(mainFilePath, content);
    updatedFiles.push(`src/algorithms/${id}/${mainFileName}`);
  } catch (error) {
    console.error(
      `Failed to write ${mainFileName} for algorithm ${id}: ${error}`
    );
    return { success: false, updatedFiles: [] };
  }

  // Update algorithm.graphig.json - only update runtimeEnv
  const graphigPath = join(workspacePath, "src", "algorithms", "algorithm.graphig.json");
  try {
    await safeReadWrite(graphigPath, (content) => {
      let config: AlgorithmGraphig = { algorithms: {} };
      try {
        config = JSON.parse(content);
      } catch (error) {
        console.log(`algorithm.graphig.json doesn't exist, creating new one`);
      }

      const existingEntry = config.algorithms[id];
      config.algorithms[id] = {
        description: existingEntry?.description || "",
        runtimeEnv: runtimeEnv as RuntimeEnv,
      };

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
export const writeAlgorithmCodeByIdTool = tool(
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
    return await writeAlgorithmCodeById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-algorithm-code-by-id",
    description:
      "Write or update the code file of a specific algorithm by its ID. Creates the folder if it doesn't exist and writes the content to the main file. The main file name is determined from config/main.json based on devEnv and runtimeEnv. Also updates algorithm.graphig.json with the runtimeEnv.",
    schema: writeAlgorithmCodeByIdSchema,
  }
);
