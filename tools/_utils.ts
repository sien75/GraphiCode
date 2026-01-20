import mainConfig from "../config/main.json";

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
  for (const devEnvConfig of mainConfig.devEnvs) {
    if (devEnvConfig.name === devEnv) {
      const runtimeEnvConfig = devEnvConfig.runtimeEnvs.find(
        (env: any) => env.name === runtimeEnv
      );
      if (runtimeEnvConfig?.files?.main) {
        return runtimeEnvConfig.files.main;
      }
    }
  }
  // Default fallback
  return "index.ts";
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
  for (const devEnvConfig of mainConfig.devEnvs) {
    if (devEnvConfig.name === devEnv) {
      const runtimeEnvConfig = devEnvConfig.runtimeEnvs.find(
        (env: any) => env.name === runtimeEnv
      );
      if (runtimeEnvConfig?.files?.test) {
        return runtimeEnvConfig.files.test;
      }
    }
  }
  // Default fallback
  return "index.test.ts";
}
