// App tools
import { readAppInfoTool } from "./app/read-app-info";

// Algorithm tools
import { readAllAlgorithmsTool } from "./algorithm/read-all-algorithms";
import { readAlgorithmByIdTool } from "./algorithm/read-algorithm-by-id";
import { readTestByIdTool } from "./algorithm/read-test-by-id";

// Type tools
import { readAllTypesTool } from "./type/read-all-types";
import { readTypeByIdTool } from "./type/read-type-by-id";

// State tools
import { readAllStatesTool } from "./state/read-all-states";
import { readStateByIdTool } from "./state/read-state-by-id";

// Flow tools
import { readAllFlowsTool } from "./flow/read-all-flows";
import { readFlowByIdTool } from "./flow/read-flow-by-id";

export const mainTools = [
  readAppInfoTool,
  readAllAlgorithmsTool,
  readAlgorithmByIdTool,
  readTestByIdTool,
  readAllTypesTool,
  readTypeByIdTool,
  readAllStatesTool,
  readStateByIdTool,
  readAllFlowsTool,
  readFlowByIdTool,
];
