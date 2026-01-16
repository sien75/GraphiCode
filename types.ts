import { BaseMessage } from "@langchain/core/messages";

export type Graphig = {
  appName: string;
  devEnv: string;
  runtimeEnv: string;
};

export type AppInfo = Graphig & {
  readme: string;
  projectConfig: any;
};

export type AgentState = {
  messages: BaseMessage[];
  types: any[];
  states: any[];
  algorithms: any[];
  flows: any[];
  path: string;
};
