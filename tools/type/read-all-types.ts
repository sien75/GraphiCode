import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { TypeGraphig } from "types";

const readAllTypesSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAllTypes(path: string): Promise<TypeGraphig> {
  const configPath = join(path, "src", "types", "type.graphig.json");

  try {
    const config: TypeGraphig = await Bun.file(configPath).json();
    return config;
  } catch (error) {
    console.error(`Failed to read type.graphig.json: ${error}`);
    // Return default structure if file doesn't exist
    return {
      declaredBy: "TypeScript",
      types: {},
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
    name: "read-all-types",
    description:
      "Read all types from src/types/type.graphig.json. Returns the type.graphig.json content which includes declaredBy and types object mapping typeId to description.",
    schema: readAllTypesSchema,
  }
);

