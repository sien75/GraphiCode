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
  path: string;
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
 * TypesConfig and TypeConfig are the configuration of the types.
 * It contains the description and types.
 */

export type TypesConfig = {
  description: string;
  types: string[];
};

export type TypeConfig = {
  description: string;
  typeDetail: {
    [typeName: string]: string;
  };
};

/**
 * StatesConfig and StateConfig are the configuration of the states.
 * It contains the description and states with runtime environment information.
 */

export type StatesConfig = {
  description: string;
  states: {
    id: string;
    runtimeEnv: RuntimeEnv;
  }[];
};

export type StateConfig = {
  description: string;
  stateDetail: {
    [stateName: string]: {
      runtimeEnv: RuntimeEnv;
      content: string;
    };
  };
};
