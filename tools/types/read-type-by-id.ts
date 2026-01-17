import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { TypeConfig } from "types";

const readTypeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The type ID (folder name) to read"),
});

// Core function that can be called directly
export async function readTypeById(
  path: string,
  id: string
): Promise<{
  config: TypeConfig;
  index: string;
}> {
  const typeFolderPath = join(path, "src", "types", id);
  const configPath = join(typeFolderPath, "config.json");
  const indexPath = join(typeFolderPath, "index.ts");

  let config = null;
  let index = "";

  // Read config.json
  try {
    config = await Bun.file(configPath).json();
  } catch (error) {
    console.error(`Failed to read config.json for type ${id}: ${error}`);
  }

  // Read index.ts
  try {
    const indexFile = Bun.file(indexPath);
    index = await indexFile.text();
  } catch (error) {
    console.error(`Failed to read index.ts for type ${id}: ${error}`);
  }

  return {
    config,
    index,
  };
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
    name: "read_type_by_id",
    description:
      "Read a specific type by its ID (folder name). Returns both config.json and index.ts content from src/types/{id}/ folder.",
    schema: readTypeByIdSchema,
  }
);
