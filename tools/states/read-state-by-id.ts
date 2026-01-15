import { tool } from "@langchain/core/tools";
import { z } from "zod";

const readStateByIdSchema = z.object({
  id: z.string().describe("The state ID to read"),
});

export const readStateByIdTool = tool(
  async (input) => {
    // TODO: Implement logic to read state by id
    return { state: null };
  },
  {
    name: "read_state_by_id",
    description: "Read a specific state by its ID",
    schema: readStateByIdSchema,
  }
);

