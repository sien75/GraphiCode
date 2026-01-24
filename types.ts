import { BaseMessage } from "@langchain/core/messages";

/**
 * AgentState is the state of the agent.
 * It contains the messages, types, states, algorithms, flows, and path.
 */

export type AgentState = {
  messages: BaseMessage[];
  types: any[];
  states: any[];
  algorithms: any[];
  flows: any[];
  workspacePath: string;
  appInfo: AppInfo | null;
};

/**
 * DevEnv represents the development environment.
 * RuntimeEnv represents the runtime environment.
 */

export type DevEnv = "Bun";

export type RuntimeEnv = "Bun" | "Browser";

/**
 * AppInfo is the information of the application.
 * It contains the graphig, readme, and projectConfig.
 */

export type Graphig = {
  appName: string;
  devEnv: string;
  runtimeEnv: string;
};

export type AppInfo = Graphig & {
  readme: string;
  projectConfig: any;
};

/**
 * TypeGraphig is the configuration file for types.
 * It contains the declared language and types mapping.
 */

export type TypeGraphig = {
  declaredBy: "TypeScript";
  types: {
    [typeId: string]: string; // typeId is the type file name, value is the description
  };
};

/**
 * StateGraphig is the configuration file for states.
 * It contains the states mapping with runtime environment information.
 */

export type StateGraphig = {
  states: {
    [stateId: string]: {
      description: string;
      runtimeEnv: RuntimeEnv;
    };
  };
};

/**
 * AlgorithmGraphig is the configuration file for algorithms.
 * It contains the algorithms mapping with runtime environment information.
 */

export type AlgorithmGraphig = {
  algorithms: {
    [algorithmId: string]: {
      description: string;
      runtimeEnv: RuntimeEnv;
    };
  };
};

/**
 * FlowGraphig is the configuration file for flows.
 * It contains the flows mapping.
 */

export type FlowGraphig = {
  flows: {
    [flowId: string]: string; // flowId is the flow folder name, value is the description
  };
};
