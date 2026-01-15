import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { join } from "path";
import type { AppInfo } from "types";

const readAppInfoSchema = z.object({
  path: z.string().describe("The relative or absolute path to the project directory"),
});

// Core function that can be called directly
export async function readAppInfo(path: string): Promise<AppInfo> {
  const graphigJsonPath = join(path, "graphig.json");
  const readmePath = join(path, "README.md");

  // read graphig.json
  let graphigConfig: { devEnv: string; runtimeEnv: string } | null = null;
  try {
    graphigConfig = await Bun.file(graphigJsonPath).json();
  } catch (error) {
    throw new Error(`Failed to read graphig.json: ${error}`);
  }

  // read README.md
  let readme: string | null = null;
  try {
    const readmeFile = Bun.file(readmePath);
    readme = await readmeFile.text();
  } catch (error) {
    throw new Error(`Failed to read README.md: ${error}`);
  }

  // read project config based on devEnv
  let projectConfig: any = null;
  try {
    switch (graphigConfig?.devEnv) {
      case "Bun":
        const packageJsonPath = join(path, "package.json");
        projectConfig = await Bun.file(packageJsonPath).json();
        break;
      default:
        break;
    }
  } catch (error) {
    throw new Error(`Failed to read project config: ${error}`);
  }

  // organize return value by AppInfo type
  const appInfo: AppInfo = {
    path: path,
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
    return await readAppInfo(input.path);
  },
  {
    name: "read_app_info",
    description: "Read application information including graphig.json, README.md, and project config from a given path",
    schema: readAppInfoSchema,
  }
);
