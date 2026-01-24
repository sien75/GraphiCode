import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import { $ } from "bun";
import mainConfig from "../../config/main.json";
import type { RuntimeEnv } from "types";
import { getTestFileName } from "../_utils";

const executeAlgorithmTestByIdSchema = z.object({
  devEnv: z.string().describe("Development environment (e.g., 'Bun')"),
  runtimeEnv: z
    .enum(["Bun", "Browser"])
    .describe("Runtime environment to use for testing"),
  workspacePath: z.string().describe("The path to the workspace"),
  id: z.string().describe("The algorithm ID (folder name) to execute test for"),
  testMethodName: z
    .string()
    .optional()
    .describe(
      "Specific test method name to use (e.g., 'BunTestRunner', 'Playwright'). If not provided, uses the first available test method for the runtime environment."
    ),
});

// Core function that can be called directly
export async function executeAlgorithmTestById(
  devEnv: string,
  runtimeEnv: RuntimeEnv,
  workspacePath: string,
  id: string,
  testMethodName?: string
): Promise<{ success: boolean; output: string; exitCode: number }> {
  const algorithmFolderPath = join(workspacePath, "src", "algorithms", id);

  // Get the test file name from config
  const testFileName = getTestFileName(devEnv, runtimeEnv);
  const testFilePath = join(algorithmFolderPath, testFileName);

  // Find the runtime environment configuration
  let testCommand: string | null = null;

  for (const devEnvConfig of mainConfig.devEnvs) {
    const runtimeEnvConfig = devEnvConfig.runtimeEnvs.find(
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
    const result = await $`cd ${workspacePath} && ${command}`.text();

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
export const executeAlgorithmTestByIdTool = tool(
  async (input) => {
    if (!input.devEnv) {
      throw new Error("devEnv is required");
    }
    if (!input.runtimeEnv) {
      throw new Error("runtimeEnv is required");
    }
    if (!input.workspacePath) {
      throw new Error("workspacePath is required");
    }
    if (!input.id) {
      throw new Error("id is required");
    }
    return await executeAlgorithmTestById(
      input.devEnv,
      input.runtimeEnv,
      input.workspacePath,
      input.id,
      input.testMethodName
    );
  },
  {
    name: "execute-algorithm-test-by-id",
    description:
      "Execute the test file for a specific algorithm by its ID. Uses the test command from config/main.json based on the runtime environment. The test file name is determined from config/main.json based on devEnv and runtimeEnv.",
    schema: executeAlgorithmTestByIdSchema,
  }
);
