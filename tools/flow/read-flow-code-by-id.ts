import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";

const readFlowCodeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The flow ID (folder name) to read"),
});

// Core function that can be called directly
export async function readFlowCodeById(
  path: string,
  id: string
): Promise<string> {
  const flowFolderPath = join(path, "src", "flows", id);
  const flowFilePath = join(flowFolderPath, "index.d2");

  // Read index.d2
  try {
    const file = Bun.file(flowFilePath);
    return await file.text();
  } catch (error) {
    console.error(`Failed to read index.d2 for flow ${id}: ${error}`);
    return "";
  }
}

// LangChain tool wrapper
export const readFlowCodeByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readFlowCodeById(input.workspacePath, input.id);
  },
  {
    name: "read-flow-code-by-id",
    description:
      "Read the code file (index.d2) of a specific flow by its ID (folder name). Returns the index.d2 content from src/flows/{id}/ folder.",
    schema: readFlowCodeByIdSchema,
  }
);
