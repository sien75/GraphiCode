import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AppInfo } from "types";

const writeAppInfoSchema = z.object({
  workspacePath: z.string().describe("The workspace path"),
  appInfo: z
    .object({
      appName: z.string().optional().describe("Application name"),
      devEnv: z
        .string()
        .optional()
        .describe("Development environment. Currently supported: 'Bun'"),
      runtimeEnv: z
        .string()
        .optional()
        .describe("Runtime environment. Currently supported: 'Bun', 'Browser'"),
      readme: z.string().optional().describe("README.md content"),
      projectConfig: z
        .any()
        .optional()
        .describe("Project configuration file content. For Bun projects: this is the package.json object."),
    })
    .describe("Partial AppInfo to update"),
});

// Core function that can be called directly
export async function writeAppInfo(
  path: string,
  appInfo: Partial<Omit<AppInfo, "path">>
): Promise<{ success: boolean; updatedFiles: string[] }> {
  const updatedFiles: string[] = [];

  // Update graphig.json if appName, devEnv or runtimeEnv is provided
  if (
    appInfo.appName !== undefined ||
    appInfo.devEnv !== undefined ||
    appInfo.runtimeEnv !== undefined
  ) {
    const graphigJsonPath = join(path, "graphig.json");

    // Read existing config
    let existingConfig: any = {};
    try {
      existingConfig = await Bun.file(graphigJsonPath).json();
    } catch (error) {
      throw new Error(`Failed to read graphig.json: ${error}`);
    }

    // Merge with new values
    const updatedConfig = {
      ...existingConfig,
      ...(appInfo.appName !== undefined && { appName: appInfo.appName }),
      ...(appInfo.devEnv !== undefined && { devEnv: appInfo.devEnv }),
      ...(appInfo.runtimeEnv !== undefined && {
        runtimeEnv: appInfo.runtimeEnv,
      }),
    };

    // Write back
    try {
      await Bun.write(graphigJsonPath, JSON.stringify(updatedConfig, null, 2));
      updatedFiles.push("graphig.json");
    } catch (error) {
      throw new Error(`Failed to write graphig.json: ${error}`);
    }
  }

  // Update README.md if provided
  if (appInfo.readme !== undefined) {
    const readmePath = join(path, "README.md");
    try {
      await Bun.write(readmePath, appInfo.readme);
      updatedFiles.push("README.md");
    } catch (error) {
      throw new Error(`Failed to write README.md: ${error}`);
    }
  }

  // Update package.json if projectConfig is provided
  if (appInfo.projectConfig !== undefined) {
    const packageJsonPath = join(path, "package.json");
    try {
      await Bun.write(
        packageJsonPath,
        JSON.stringify(appInfo.projectConfig, null, 2)
      );
      updatedFiles.push("package.json");
    } catch (error) {
      throw new Error(`Failed to write package.json: ${error}`);
    }
  }

  return {
    success: true,
    updatedFiles,
  };
}

// LangChain tool wrapper
export const writeAppInfoTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("Path is required");
    }
    return await writeAppInfo(input.workspacePath, input.appInfo);
  },
  {
    name: "write_app_info",
    description:
      "Write/update application information including graphig.json, README.md, and project config. Only updates the files for which data is provided.",
    schema: writeAppInfoSchema,
  }
);
