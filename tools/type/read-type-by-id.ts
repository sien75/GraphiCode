import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";

const readTypeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The type ID (folder name) to read"),
});

// Core function that can be called directly
export async function readTypeById(
  path: string,
  id: string
): Promise<string> {
  const typeFolderPath = join(path, "src", "types", id);
  const indexPath = join(typeFolderPath, "index.ts");

  // Read index.ts
  try {
    const indexFile = Bun.file(indexPath);
    return await indexFile.text();
  } catch (error) {
    console.error(`Failed to read index.ts for type ${id}: ${error}`);
    return "";
  }
}

// LangChain tool wrapper
export const readTypeByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await readTypeById(input.workspacePath, input.id);
  },
  {
    name: "read-type-by-id",
    description:
      "Read a specific type by its ID (folder name). Returns the index.ts content from src/types/{id}/ folder.",
    schema: readTypeByIdSchema,
  }
);
