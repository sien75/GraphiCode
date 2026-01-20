import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import type { RuntimeEnv } from "types";
import { getMainFileName } from "../_utils";

const writeAlgorithmByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
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
      "New main file content. If undefined or null, main file will not be modified"
    ),
});

// Core function that can be called directly
export async function writeAlgorithmById(
  devEnv: string,
  runtimeEnv: string,
  workspacePath: string,
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
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");

  // Get the main file name from config
  const mainFileName = getMainFileName(devEnv, runtimeEnv);
  const mainFilePath = join(algorithmFolderPath, mainFileName);

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

  // Write main file only if newAlgorithmFile is provided
  if (newAlgorithmFile !== undefined && newAlgorithmFile !== null) {
    try {
      await Bun.write(mainFilePath, newAlgorithmFile);
      updatedFiles.push(`src/algorithms/${id}/${mainFileName}`);
    } catch (error) {
      console.error(
        `Failed to write ${mainFileName} for algorithm ${id}: ${error}`
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
    return await writeAlgorithmById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id,
      input.newConfig,
      input.newAlgorithmFile
    );
  },
  {
    name: "write_algorithm_by_id",
    description:
      "Write or update a specific algorithm by its ID. Creates the folder if it doesn't exist. Only updates the files for which data is provided (newConfig for config.json, newAlgorithmFile for main file). The main file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: writeAlgorithmByIdSchema,
  }
);

