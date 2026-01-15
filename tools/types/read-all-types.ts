import { tool } from "@langchain/core/tools";
import { z } from "zod";

const readAllTypesSchema = z.object({});

export const readAllTypesTool = tool(
  async (input) => {
    // TODO: Implement logic to read all types
    return { types: [] };
  },
  {
    name: "read_all_types",
    description: "Read all types from the system",
    schema: readAllTypesSchema,
  }
);

