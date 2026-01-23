import type { AgentState } from "../types";

/**
 * App node - handles app-level configuration and information tasks
 * Currently a placeholder that passes through the state
 */
export async function appNode(state: AgentState): Promise<Partial<AgentState>> {
  // TODO: Implement app logic
  // This node should handle app information reading and writing
  // Including graphig.json, README.md, and project config management
  
  return {
    messages: state.messages,
  };
}
