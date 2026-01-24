import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";

const writeTypeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The type ID (folder name) to write"),
  content: z
    .string()
    .describe("New index.ts file content"),
});

// Core function that can be called directly
export async function writeTypeById(
  path: string,
  id: string,
  content: string
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const typeFolderPath = join(path, "src", "types", id);
  const indexPath = join(typeFolderPath, "index.ts");
  const updatedFiles: string[] = [];

  // Ensure the type folder exists
  try {
    await mkdir(typeFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create type folder ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  // Write index.ts
  try {
    await Bun.write(indexPath, content);
    updatedFiles.push(`src/types/${id}/index.ts`);
  } catch (error) {
    console.error(`Failed to write index.ts for type ${id}: ${error}`);
    return { success: false, updatedFiles: [] };
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeTypeByIdTool = tool(
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
    return await writeTypeById(
      input.workspacePath,
      input.id,
      input.content
    );
  },
  {
    name: "write-type-by-id",
    description:
      "Write or update a specific type by its ID. Creates the folder if it doesn't exist and writes the content to index.ts file.",
    schema: writeTypeByIdSchema,
  }
);
