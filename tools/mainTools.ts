// App tools
import { readAppInfoTool } from "./app/read-app-info";

// Algorithm tools
import { readAllAlgorithmsTool } from "./algorithm/read-all-algorithms";
import { readAlgorithmReadmeByIdTool } from "./algorithm/read-algorithm-readme-by-id";
import { readAlgorithmCodeByIdTool } from "./algorithm/read-algorithm-code-by-id";

// Test tools - Algorithm
import { readAlgorithmTestDocByIdTool } from "./test/read-algorithm-test-doc-by-id";
import { readAlgorithmTestCodeByIdTool } from "./test/read-algorithm-test-code-by-id";
import { executeAlgorithmTestByIdTool } from "./test/execute-algorithm-test-by-id";

// Test tools - State
import { readStateTestDocByIdTool } from "./test/read-state-test-doc-by-id";
import { readStateTestCodeByIdTool } from "./test/read-state-test-code-by-id";
import { executeStateTestByIdTool } from "./test/execute-state-test-by-id";

// Type tools
import { readAllTypesTool } from "./type/read-all-types";
import { readTypeByIdTool } from "./type/read-type-by-id";

// State tools
import { readAllStatesTool } from "./state/read-all-states";
import { readStateReadmeByIdTool } from "./state/read-state-readme-by-id";
import { readStateCodeByIdTool } from "./state/read-state-code-by-id";

// Flow tools
import { readAllFlowsTool } from "./flow/read-all-flows";
import { readFlowByIdTool } from "./flow/read-flow-by-id";

export const mainTools = [
  readAppInfoTool,
  readAllAlgorithmsTool,
  readAlgorithmReadmeByIdTool,
  readAlgorithmCodeByIdTool,
  readAlgorithmTestDocByIdTool,
  readAlgorithmTestCodeByIdTool,
  executeAlgorithmTestByIdTool,
  readAllTypesTool,
  readTypeByIdTool,
  readAllStatesTool,
  readStateReadmeByIdTool,
  readStateCodeByIdTool,
  readStateTestDocByIdTool,
  readStateTestCodeByIdTool,
  executeStateTestByIdTool,
  readAllFlowsTool,
  readFlowByIdTool,
];
