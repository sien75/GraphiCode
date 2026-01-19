import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import type { RuntimeEnv } from "types";

const writeFlowByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The flow ID (folder name) to write"),
  newConfig: z
    .object({
      description: z.string().describe("Description of the flow folder"),
      flowDetail: z
        .record(
          z.string(),
          z.object({
            runtimeEnv: z
              .enum(["Bun", "Browser"])
              .describe("Runtime environment for this flow"),
            content: z.string().describe("Content description of the flow"),
          })
        )
        .describe(
          "Object mapping flow names to their runtime environment and content description"
        ),
    })
    .optional()
    .describe(
      "New config.json content. If undefined or null, config.json will not be modified"
    ),
  newFlowFile: z
    .string()
    .optional()
    .describe(
      "New flow.ts file content. If undefined or null, flow.ts will not be modified"
    ),
});

// Core function that can be called directly
export async function writeFlowById(
  path: string,
  id: string,
  newConfig?: {
    description: string;
    flowDetail: {
      [flowId: string]: {
        runtimeEnv: RuntimeEnv;
        content: string;
      };
    };
  } | null,
  newFlowFile?: string | null
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const flowFolderPath = join(path, "src", "flows", id);
  const configPath = join(flowFolderPath, "config.json");
  const flowFilePath = join(flowFolderPath, "flow.ts");
  const updatedFiles: string[] = [];

  // Ensure the flow folder exists if we need to write anything
  if (newConfig || newFlowFile) {
    try {
      await mkdir(flowFolderPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create flow folder ${id}: ${error}`);
      return { success: false, updatedFiles: [] };
    }
  }

  // Write config.json only if newConfig is provided
  if (newConfig !== undefined && newConfig !== null) {
    try {
      await Bun.write(configPath, JSON.stringify(newConfig, null, 2));
      updatedFiles.push(`src/flows/${id}/config.json`);
    } catch (error) {
      console.error(`Failed to write config.json for flow ${id}: ${error}`);
    }
  }

  // Write flow.ts only if newFlowFile is provided
  if (newFlowFile !== undefined && newFlowFile !== null) {
    try {
      await Bun.write(flowFilePath, newFlowFile);
      updatedFiles.push(`src/flows/${id}/flow.ts`);
    } catch (error) {
      console.error(`Failed to write flow.ts for flow ${id}: ${error}`);
    }
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeFlowByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await writeFlowById(
      input.workspacePath,
      input.id,
      input.newConfig,
      input.newFlowFile
    );
  },
  {
    name: "write_flow_by_id",
    description:
      "Write or update a specific flow by its ID. Creates the folder if it doesn't exist. Only updates the files for which data is provided (newConfig for config.json, newFlowFile for flow.ts).",
    schema: writeFlowByIdSchema,
  }
);

