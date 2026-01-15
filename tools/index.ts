import { ToolNode } from "@langchain/langgraph/prebuilt";

// App tools
import { readAppInfoTool } from "./app/read-app-info";
import { writeAppInfoTool } from "./app/write-app-info";

// Algorithm tools
import { readAllAlgorithmsTool } from "./algorithms/read-all-algorithms";
import { readAlgorithmByIdTool } from "./algorithms/read-algorithm-by-id";
import { writeAlgorithmByIdTool } from "./algorithms/write-algorithm-by-id";
import { testAlgorithmByIdTool } from "./algorithms/test-algorithm-by-id";

// Type tools
import { readAllTypesTool } from "./types/read-all-types";
import { readTypeByIdTool } from "./types/read-type-by-id";
import { writeTypeByIdTool } from "./types/write-type-by-id";

// State tools
import { readAllStatesTool } from "./states/read-all-states";
import { readStateByIdTool } from "./states/read-state-by-id";
import { writeStateByIdTool } from "./states/write-state-by-id";

// Flow tools
import { readAllFlowsTool } from "./flows/read-all-flows";
import { readFlowByIdTool } from "./flows/read-flow-by-id";
import { writeFlowByIdTool } from "./flows/write-flow-by-id";

// All tools array
export const tools = [
  readAppInfoTool,
  writeAppInfoTool,
  readAllAlgorithmsTool,
  readAlgorithmByIdTool,
  writeAlgorithmByIdTool,
  testAlgorithmByIdTool,
  readAllTypesTool,
  readTypeByIdTool,
  writeTypeByIdTool,
  readAllStatesTool,
  readStateByIdTool,
  writeStateByIdTool,
  readAllFlowsTool,
  readFlowByIdTool,
  writeFlowByIdTool,
];

// Unified tool node for LangGraph
export const toolNode = new ToolNode(tools);
