import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";
import { safeReadWrite } from "../_concurrent-write-file";
import type { FlowGraphig } from "types";

const writeFlowCodeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The flow ID (folder name) to write"),
  content: z
    .string()
    .describe("New index.d2 file content"),
  description: z
    .string()
    .describe("Description of the flow (required, for graphig.json)"),
});

// Core function that can be called directly
export async function writeFlowCodeById(
  path: string,
  id: string,
  content: string,
  description: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const flowFolderPath = join(path, "src", "flows", id);
  const flowFilePath = join(flowFolderPath, "index.d2");
  const updatedFiles: string[] = [];

  // Ensure the flow folder exists
  try {
    await mkdir(flowFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create flow folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write index.d2
  try {
    await Bun.write(flowFilePath, content);
    updatedFiles.push(`src/flows/${id}/index.d2`);
  } catch (error) {
    console.error(`Failed to write index.d2 for flow ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Update flow.graphig.json
  const graphigPath = join(path, "src", "flows", "flow.graphig.json");
  try {
    await safeReadWrite(graphigPath, (content) => {
      let config: FlowGraphig = { flows: {} };
      try {
        config = JSON.parse(content);
      } catch (error) {
        console.log(`flow.graphig.json doesn't exist, creating new one`);
      }

      config.flows[id] = description;

      return JSON.stringify(config, null, 2);
    });
    updatedFiles.push(`src/flows/flow.graphig.json`);
  } catch (error) {
    console.error(`Failed to update flow.graphig.json: ${error}`);
    return { success: false, updatedFiles };
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeFlowCodeByIdTool = tool(
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
    return await writeFlowCodeById(
      input.workspacePath,
      input.id,
      input.content,
      input.description
    );
  },
  {
    name: "write-flow-code-by-id",
    description:
      "Write or update the code file (index.d2) of a specific flow by its ID. Creates the folder if it doesn't exist and writes the content to index.d2 file. Also updates flow.graphig.json with the flow description.",
    schema: writeFlowCodeByIdSchema,
  }
);
