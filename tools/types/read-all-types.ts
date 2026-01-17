import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { TypesConfig } from "types";

const readAllTypesSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllTypes(path: string): Promise<TypesConfig> {
  const configPath = join(path, "src", "types", "config.json");

  try {
    const config: TypesConfig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read types config.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      description: "",
      types: [],
    };
  }
}

// LangChain tool wrapper
export const readAllTypesTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    return await readAllTypes(input.workspacePath);
  },
  {
    name: "read_all_types",
    description:
      "Read all types from src/types/config.json. Returns the config.json content which includes description and types array.",
    schema: readAllTypesSchema,
  }
);

