#!/usr/bin/env bun

import { spawn } from "bun";

// Get all arguments after the script name
const args = process.argv.slice(2);

// Run playwright test with all passed arguments
const proc = spawn({
  cmd: ["bunx", "playwright", "test", ...args],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const exitCode = await proc.exited;
process.exit(exitCode);
