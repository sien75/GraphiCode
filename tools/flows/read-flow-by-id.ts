import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { FlowConfig } from "types";

const readFlowByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The flow ID (folder name) to read"),
});

// Core function that can be called directly
export async function readFlowById(
  path: string,
  id: string
): Promise<{
  config: FlowConfig;
  flowFile: string;
}> {
  const flowFolderPath = join(path, "src", "flows", id);
  const configPath = join(flowFolderPath, "config.json");
  const flowFilePath = join(flowFolderPath, "flow.ts");

  let config = null;
  let flowFile = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for flow ${id}: ${error}`);
  }

  // Read flow.ts
  try {
    const file = Bun.file(flowFilePath);
    flowFile = await file.text();
  } catch (error) {
    console.error(`Failed to read flow.ts for flow ${id}: ${error}`);
  }

  return {
    config,
    flowFile,
  };
}

// LangChain tool wrapper
export const readFlowByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readFlowById(input.workspacePath, input.id);
  },
  {
    name: "read_flow_by_id",
    description:
      "Read a specific flow by its ID (folder name). Returns both config.json and flow.ts content from src/flows/{id}/ folder.",
    schema: readFlowByIdSchema,
  }
);

