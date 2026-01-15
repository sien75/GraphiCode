import { tool } from "@langchain/core/tools";
import { z } from "zod";

const readAllAlgorithmsSchema = z.object({});

export const readAllAlgorithmsTool = tool(
  async (input) => {
    // TODO: Implement logic to read all algorithms
    return { algorithms: [] };
  },
  {
    name: "read_all_algorithms",
    description: "Read all algorithms from the system",
    schema: readAllAlgorithmsSchema,
  }
);

