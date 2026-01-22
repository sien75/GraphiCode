import { HumanMessage } from "@langchain/core/messages";
import * as readline from "readline";

/* Create readline interface */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/* Human node: wait for user input */

export async function humanNode(state: any): Promise<any> {
  return new Promise((resolve) => {
    // Wait for user input
    rl.question("You: ", (input) => {
      if (!input.trim()) {
        // If empty input, ask again
        resolve(humanNode(state));
        return;
      }

      // Add user message to state
      const userMessage = new HumanMessage(input);
      resolve({
        messages: [...state.messages, userMessage],
      });
    });
  });
}

/* Export readline interface for use in main command */

export { rl };
