import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { $ } from "bun";
import mainConfig from "../../config/main.json";
import type { RuntimeEnv } from "types";

const executeTestByIdSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to execute test for"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment to use for testing"),
  testMethodName: z
    .string()
    .optional()
    .describe(
      "Specific test method name to use (e.g., 'BunTestRunner', 'Playwright'). If not provided, uses the first available test method for the runtime environment."
    ),
});

// Core function that can be called directly
export async function executeTestById(
  path: string,
  id: string,
  runtimeEnv: RuntimeEnv,
  testMethodName?: string
): Promise<{ success: boolean; output: string; exitCode: number }> {
  const algorithmFolderPath = join(path, "src", "algorithms", id);
  const testFilePath = join(algorithmFolderPath, "index.test.ts");

  // Find the runtime environment configuration
  let testCommand: string | null = null;

  for (const devEnv of mainConfig.devEnvs) {
    const runtimeEnvConfig = devEnv.runtimeEnvs.find(
      (env: any) => env.name === runtimeEnv
    );

    if (runtimeEnvConfig) {
      // Find the test method
      let testMethod;
      if (testMethodName) {
        testMethod = runtimeEnvConfig.testMethods.find(
          (method: any) => method.name === testMethodName
        );
      } else {
        // Use the first available test method
        testMethod = runtimeEnvConfig.testMethods[0];
      }

      if (testMethod) {
        testCommand = testMethod.command;
        break;
      }
    }
  }

  if (!testCommand) {
    return {
      success: false,
      output: `No test method found for runtime environment: ${runtimeEnv}${testMethodName ? ` with method: ${testMethodName}` : ""}`,
      exitCode: 1,
    };
  }

  // Replace {testFile} with the actual test file path
  const command = testCommand.replace("{testFile}", testFilePath);

  try {
    // Execute the test command using Bun.shell
    const result = await $`cd ${path} && ${command}`.text();

    return {
      success: true,
      output: result,
      exitCode: 0,
    };
  } catch (error: any) {
    // Bun.shell throws an error if the command fails
    return {
      success: false,
      output: error.stderr?.toString() || error.stdout?.toString() || error.message || String(error),
      exitCode: error.exitCode || 1,
    };
  }
}

// LangChain tool wrapper
export const executeTestByIdTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    if (!input.runtimeEnv) {
      throw new Error("runtimeEnv is required");
    }
    return await executeTestById(
      input.workspacePath,
      input.id,
      input.runtimeEnv,
      input.testMethodName
    );
  },
  {
    name: "execute_test_by_id",
    description:
      "Execute the test file (index.test.ts) for a specific algorithm by its ID. Uses the test command from config/main.json based on the runtime environment.",
    schema: executeTestByIdSchema,
  }
);
