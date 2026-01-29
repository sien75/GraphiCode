// Algorithm tools
import { readAllAlgorithmsTool } from "../tools/algorithm/read-all-algorithms";
import { readAlgorithmReadmeByIdTool } from "../tools/algorithm/read-algorithm-readme-by-id";
import { writeAlgorithmReadmeByIdTool } from "../tools/algorithm/write-algorithm-readme-by-id";

// State tools
import { readAllStatesTool } from "../tools/state/read-all-states";
import { readStateReadmeByIdTool } from "../tools/state/read-state-readme-by-id";
import { writeStateReadmeByIdTool } from "../tools/state/write-state-readme-by-id";

// Type tools
import { readAllTypesTool } from "../tools/type/read-all-types";
import { readTypeByIdTool } from "../tools/type/read-type-by-id";
import { writeTypeByIdTool } from "../tools/type/write-type-by-id";

// Flow tools
import { readAllFlowsTool } from "../tools/flow/read-all-flows";
import { readFlowCodeByIdTool } from "../tools/flow/read-flow-code-by-id";
import { writeFlowCodeByIdTool } from "../tools/flow/write-flow-code-by-id";

export const architectTools = [
  readAllAlgorithmsTool,
  readAlgorithmReadmeByIdTool,
  writeAlgorithmReadmeByIdTool,
  readAllStatesTool,
  readStateReadmeByIdTool,
  writeStateReadmeByIdTool,
  readAllTypesTool,
  readTypeByIdTool,
  writeTypeByIdTool,
  readAllFlowsTool,
  readFlowCodeByIdTool,
  writeFlowCodeByIdTool,
];

export const architectModelName = "google/gemini-3-flash-preview";
