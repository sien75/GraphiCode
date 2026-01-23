import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import type { RuntimeEnv } from "types";
import { getTestFileName } from "../_utils";

const writeTestByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment for the algorithm"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to write test for"),
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
  newTestFile: z
    .string()
    .optional()
    .describe(
      "New test file content. If undefined or null, test file will not be modified"
    ),
});

// Core function that can be called directly
export async function writeTestById(
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
  newTestFile?: string | null
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);
  const configPath = join(algorithmFolderPath, "config.json");

  // Get the test file name from config
  const testFileName = getTestFileName(devEnv, runtimeEnv);
  const testFilePath = join(algorithmFolderPath, testFileName);

  const updatedFiles: string[] = [];

  // Ensure the algorithm folder exists if we need to write anything
  if (newConfig || newTestFile) {
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

  // Write test file only if newTestFile is provided
  if (newTestFile !== undefined && newTestFile !== null) {
    try {
      await Bun.write(testFilePath, newTestFile);
      updatedFiles.push(`src/algorithms/${id}/${testFileName}`);
    } catch (error) {
      console.error(
        `Failed to write test file for algorithm ${id}: ${error}`
      );
    }
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeTestByIdTool = tool(
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
    return await writeTestById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id,
      input.newConfig,
      input.newTestFile
    );
  },
  {
    name: "write-test-by-id",
    description:
      "Write or update the test file and/or config.json for a specific algorithm by its ID. Creates the folder if it doesn't exist. Only updates the files for which data is provided (newConfig for config.json, newTestFile for test file). The test file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: writeTestByIdSchema,
  }
);
