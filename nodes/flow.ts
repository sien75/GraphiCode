import type { AgentState } from "../types";

/**
 * Flow node - handles flow diagram tasks
 * Currently a placeholder that passes through the state
 */
export async function flowNode(state: AgentState): Promise<Partial<AgentState>> {
  // TODO: Implement flow logic
  // This node should handle D2 flow diagram creation and modification
  // Flows contain major processes and event subscriptions
  
  return {
    messages: state.messages,
  };
}
