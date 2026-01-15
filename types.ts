import { BaseMessage } from "@langchain/core/messages";

export type ToolCall = {
  toolName: string;
  args: Record<string, any>;
};

export type ToolCallResult = ToolCall & {
  error?: any;
  result: any;
  timeStamp: number;
};

export type AppInfo = {
  path: string;
  devEnv: string;
  runtimeEnv: string;
  readme: string;
  projectConfig: any;
};

export type AgentState = {
  messages: BaseMessage[];
  toolCalls: ToolCall[];
  toolCallResults: ToolCallResult[];
  types: any[];
  states: any[];
  algorithms: any[];
  flows: any[];
  appInfo?: AppInfo;
};
