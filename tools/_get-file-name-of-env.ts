import mainConfig from "../config/main.json";

function getFileName(
  language: string,
  devEnv: string,
  runtimeEnv: string,
  fileType: string,
  defaultFileName: string
): string {
  for (const languageConfig of mainConfig.languages) {
    if (languageConfig.name === language) {
      for (const devEnvConfig of languageConfig.devEnvs) {
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
    }
  }
  // Default fallback
  return defaultFileName;
}

/**
 * Get the main file name for a given language, dev environment and runtime environment
 * @param language Language (e.g., 'TypeScript')
 * @param devEnv Development environment (e.g., 'Bun')
 * @param runtimeEnv Runtime environment (e.g., 'Bun', 'Browser')
 * @returns The main file name (e.g., 'index.ts')
 */
export function getMainFileName(
  language: string,
  devEnv: string,
  runtimeEnv: string
): string {
  return getFileName(language, devEnv, runtimeEnv, "main", "index.ts");
}

/**
 * Get the test file name for a given language, dev environment and runtime environment
 * @param language Language (e.g., 'TypeScript')
 * @param devEnv Development environment (e.g., 'Bun')
 * @param runtimeEnv Runtime environment (e.g., 'Bun', 'Browser')
 * @returns The test file name (e.g., 'index.test.ts')
 */
export function getTestFileName(
  language: string,
  devEnv: string,
  runtimeEnv: string
): string {
  return getFileName(language, devEnv, runtimeEnv, "test", "index.test.ts");
}
