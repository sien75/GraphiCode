import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AppInfo, Graphig } from "types";
import mainConfig from "config/main.json";

const readAppInfoSchema = z.object({
  workspacePath: z.string().describe("The path to the workspace"),
});

// Core function that can be called directly
export async function readAppInfo(path: string): Promise<AppInfo> {
  const graphigJsonPath = join(path, "graphig.json");
  const readmePath = join(path, "README.md");

  // read graphig.json
  let graphigConfig: Graphig | null = null;
  try {
    graphigConfig = await Bun.file(graphigJsonPath).json();
  } catch (error) {
    console.error(`Failed to read graphig.json: ${error}`);
  }

  // read README.md
  let readme: string | null = null;
  try {
    const readmeFile = Bun.file(readmePath);
    readme = await readmeFile.text();
  } catch (error) {
    console.error(`Failed to read README.md: ${error}`);
  }

  // read project config based on language and devEnv from config/main.json
  let projectConfig: any = null;
  try {
    // Find the language configuration first, then devEnv
    const languageConfig = mainConfig.languages?.find(
      (lang: any) => lang.name === graphigConfig?.language
    );
    const devEnvConfig = languageConfig?.devEnvs?.find(
      (env: any) => env.name === graphigConfig?.devEnv
    );
    
    if (devEnvConfig?.projectConfig) {
      const projectConfigPath = join(path, devEnvConfig.projectConfig);
      projectConfig = await Bun.file(projectConfigPath).json();
    }
  } catch (error) {
    console.error(`Failed to read project config: ${error}`);
  }

  // organize return value by AppInfo type
  const appInfo: AppInfo = {
    appName: graphigConfig?.appName || "Unknown",
    language: graphigConfig?.language || "TypeScript",
    devEnv: graphigConfig?.devEnv || "Bun",
    runtimeEnv: graphigConfig?.runtimeEnv || "Bun",
    readme: readme || "",
    projectConfig: projectConfig || {},
  };

  return appInfo;
}

// LangChain tool wrapper
export const readAppInfoTool = tool(
  async (input) => {
    if (!input.workspacePath) {
      throw new Error("Path is required");
    }
    return await readAppInfo(input.workspacePath);
  },
  {
    name: "read-app-info",
    description: "Read application information including graphig.json, README.md, and project config from the specified path.",
    schema: readAppInfoSchema,
  }
);
