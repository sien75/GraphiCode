import mainConfig from "../config/main.json";

function getFileName(
  devEnv: string,
  runtimeEnv: string,
  fileType: string,
  defaultFileName: string
): string {
  for (const devEnvConfig of mainConfig.devEnvs) {
    if (devEnvConfig.name === devEnv) {
      const runtimeEnvConfig = devEnvConfig.runtimeEnvs.find(
        (env: any) => env.name === runtimeEnv
      );
      const files = runtimeEnvConfig?.files as any;
      if (files?.[fileType]) {
        return files[fileType];
      }
    }
  }
  // Default fallback
  return defaultFileName;
}

/**
 * Get the main file name for a given dev environment and runtime environment
 * @param devEnv Development environment (e.g., 'Bun')
 * @param runtimeEnv Runtime environment (e.g., 'Bun', 'Browser')
 * @returns The main file name (e.g., 'index.ts')
 */
export function getMainFileName(
  devEnv: string,
  runtimeEnv: string
): string {
  return getFileName(devEnv, runtimeEnv, "main", "index.ts");
}

/**
 * Get the test file name for a given dev environment and runtime environment
 * @param devEnv Development environment (e.g., 'Bun')
 * @param runtimeEnv Runtime environment (e.g., 'Bun', 'Browser')
 * @returns The test file name (e.g., 'index.test.ts')
 */
export function getTestFileName(
  devEnv: string,
  runtimeEnv: string
): string {
  return getFileName(devEnv, runtimeEnv, "test", "index.test.ts");
}
