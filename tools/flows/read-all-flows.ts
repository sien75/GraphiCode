import { tool } from "@langchain/core/tools";
import { z } from "zod";

const readAllFlowsSchema = z.object({});

export const readAllFlowsTool = tool(
  async (input) => {
    // TODO: Implement logic to read all flows
    return { flows: [] };
  },
  {
    name: "read_all_flows",
    description: "Read all flows from the system",
    schema: readAllFlowsSchema,
  }
);

