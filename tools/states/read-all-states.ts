import { tool } from "@langchain/core/tools";
import { z } from "zod";

const readAllStatesSchema = z.object({});

export const readAllStatesTool = tool(
  async (input) => {
    // TODO: Implement logic to read all states
    return { states: [] };
  },
  {
    name: "read_all_states",
    description: "Read all states from the system",
    schema: readAllStatesSchema,
  }
);

