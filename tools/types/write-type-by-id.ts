import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { mkdir } from "fs/promises";

const writeTypeByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The type ID (folder name) to write"),
  newConfig: z
    .object({
      description: z.string().describe("Description of the type folder"),
      typeDetail: z
        .record(z.string(), z.string())
        .describe("Object mapping type names to their descriptions"),
    })
    .optional()
    .describe(
      "New config.json content. If undefined or null, config.json will not be modified"
    ),
  newIndexTs: z
    .string()
    .optional()
    .describe(
      "New index.ts file content. If undefined or null, index.ts will not be modified"
    ),
});

// Core function that can be called directly
export async function writeTypeById(
  path: string,
  id: string,
  newConfig?: {
    description: string;
    typeDetail: Record<string, string>;
  } | null,
  newIndexTs?: string | null
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const typeFolderPath = join(path, "src", "types", id);
  const configPath = join(typeFolderPath, "config.json");
  const indexPath = join(typeFolderPath, "index.ts");
  const updatedFiles: string[] = [];

  // Ensure the type folder exists if we need to write anything
  if (newConfig || newIndexTs) {
    try {
      await mkdir(typeFolderPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create type folder ${id}: ${error}`);
      return { success: false, updatedFiles: [] };
    }
  }

  // Write config.json only if newConfig is provided
  if (newConfig !== undefined && newConfig !== null) {
    try {
      await Bun.write(configPath, JSON.stringify(newConfig, null, 2));
      updatedFiles.push(`src/types/${id}/config.json`);
    } catch (error) {
      console.error(`Failed to write config.json for type ${id}: ${error}`);
    }
  }

  // Write index.ts only if newIndexTs is provided
  if (newIndexTs !== undefined && newIndexTs !== null) {
    try {
      await Bun.write(indexPath, newIndexTs);
      updatedFiles.push(`src/types/${id}/index.ts`);
    } catch (error) {
      console.error(`Failed to write index.ts for type ${id}: ${error}`);
    }
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
    return await writeTypeById(
      input.workspacePath,
      input.id,
      input.newConfig,
      input.newIndexTs
    );
  },
  {
    name: "write_type_by_id",
    description:
      "Write or update a specific type by its ID. Creates the folder if it doesn't exist. Only updates the files for which data is provided (newConfig for config.json, newIndexTs for index.ts).",
    schema: writeTypeByIdSchema,
  }
);
