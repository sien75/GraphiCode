#!/usr/bin/env bun

import { join } from "path";
import type { AppInfo } from "./types";

// read path from command line arguments
const path = Bun.argv[2];
if (!path) {
  console.error("Usage: graphicode <path>");
  process.exit(1);
}

const graphigJsonPath = join(path, "graphig.json");
const readmePath = join(path, "README.md");

// read graphig.json
let graphigConfig: { devEnv: string; runtimeEnv: string } | null = null;
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
  console.error(`Failed to read project config: ${error}`);
}

// organize return value by AppInfo type
const appInfo: AppInfo = {
  path: path,
  devEnv: graphigConfig?.devEnv || "Bun",
  runtimeEnv: graphigConfig?.runtimeEnv || "Bun",
  readme: readme || "",
  projectConfig: projectConfig || {},
};

console.log(JSON.stringify(appInfo, null, 2));
