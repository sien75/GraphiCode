#!/usr/bin/env bun
import { readAppInfo } from "./tools/app/read-app-info";

// read path from command line arguments
let path = Bun.argv[2];

// if no path provided, show usage and exit
if (!path) {
  console.error("Usage: graphicode <path>");
  console.error("Example: graphicode . or graphicode ./my-project");
  process.exit(1);
}

// read app info and output as JSON
const appInfo = await readAppInfo(path);
console.log(JSON.stringify(appInfo, null, 2));
