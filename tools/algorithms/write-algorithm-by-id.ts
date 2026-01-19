import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import type { RuntimeEnv } from "types";

const writeAlgorithmByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to write"),
  newConfig: z
    .object({
      description: z.string().describe("Description of the algorithm folder"),
      algorithmDetail: z
        .record(
          z.string(),
          z.object({
            runtimeEnv: z
              .enum(["Bun", "Browser"])
              .describe("Runtime environment for this algorithm"),
            content: z.string().describe("Content description of the algorithm"),
          })
        )
        .describe(
          "Object mapping algorithm names to their runtime environment and content description"
        ),
    })
    .optional()
    .describe(
      "New config.json content. If undefined or null, config.json will not be modified"
    ),
  newAlgorithmFile: z
    .string()
    .optional()
    .describe(
      "New algorithm.ts file content. If undefined or null, algorithm.ts will not be modified"
    ),
});

// Core function that can be called directly
export async function writeAlgorithmById(
  path: string,
  id: string,
  newConfig?: {
    description: string;
    algorithmDetail: {
      [algorithmId: string]: {
        runtimeEnv: RuntimeEnv;
        content: string;
      };
    };
  } | null,
  newAlgorithmFile?: string | null
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");
  const algorithmFilePath = join(algorithmFolderPath, "algorithm.ts");
  const updatedFiles: string[] = [];

  // Ensure the algorithm folder exists if we need to write anything
  if (newConfig || newAlgorithmFile) {
    try {
      await mkdir(algorithmFolderPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create algorithm folder ${id}: ${error}`);
      return { success: false, updatedFiles: [] };
    }
  }

  // Write config.json only if newConfig is provided
  if (newConfig !== undefined && newConfig !== null) {
    try {
      await Bun.write(configPath, JSON.stringify(newConfig, null, 2));
      updatedFiles.push(`src/algorithms/${id}/config.json`);
    } catch (error) {
      console.error(`Failed to write config.json for algorithm ${id}: ${error}`);
    }
  }

  // Write algorithm.ts only if newAlgorithmFile is provided
  if (newAlgorithmFile !== undefined && newAlgorithmFile !== null) {
    try {
      await Bun.write(algorithmFilePath, newAlgorithmFile);
      updatedFiles.push(`src/algorithms/${id}/algorithm.ts`);
    } catch (error) {
      console.error(
        `Failed to write algorithm.ts for algorithm ${id}: ${error}`
      );
    }
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeAlgorithmByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await writeAlgorithmById(
      input.workspacePath,
      input.id,
      input.newConfig,
      input.newAlgorithmFile
    );
  },
  {
    name: "write_algorithm_by_id",
    description:
      "Write or update a specific algorithm by its ID. Creates the folder if it doesn't exist. Only updates the files for which data is provided (newConfig for config.json, newAlgorithmFile for algorithm.ts).",
    schema: writeAlgorithmByIdSchema,
  }
);

