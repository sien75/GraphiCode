/* Display node: show tool results and assistant message */

export async function displayNode(state: any): Promise<any> {
  const messages = state.messages;

  // // Display tool results if any
  // if (messages.length >= 2) {
  //   const secondLastMessage = messages[messages.length - 2];
  //   if (secondLastMessage && secondLastMessage.type === "tool") {
  //     console.log(`\n[Tool Result]: ${secondLastMessage.content}\n`);
  //   }
  // }

  // Display the latest assistant message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.content) {
    console.log(`Assistant: ${lastMessage.content}\n`);
  }

  // Return empty object - no state changes, just display
  return {};
}
