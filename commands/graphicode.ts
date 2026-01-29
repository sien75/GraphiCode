#!/usr/bin/env bun
import { rmSync, mkdirSync } from "fs";
import { runAgent } from "../agent/index";
import { readAllStates } from "../tools/state/read-all-states";
import { readAllTypes } from "../tools/type/read-all-types";
import { readAllAlgorithms } from "../tools/algorithm/read-all-algorithms";
import { readAllFlows } from "../tools/flow/read-all-flows";
import { readFlowCodeById } from "../tools/flow/read-flow-code-by-id";
import { renderD2ToSVGContent } from "../flow/renderer";

async function buildView() {
  const viewDir = `${import.meta.dir}/../view`;
  const outDir = `${viewDir}/out`;

  console.log("🧹 Cleaning output directory...");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  console.log("📦 Building main.tsx...");
  const buildResult = await Bun.build({
    entrypoints: [`${viewDir}/main.tsx`],
    outdir: outDir,
    minify: true,
    sourcemap: "external",
    target: "browser",
  });

  if (!buildResult.success) {
    console.error("❌ Build failed:");
    for (const log of buildResult.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  console.log("📄 Copying index.html...");
  const htmlContent = await Bun.file(`${viewDir}/index.html`).text();
  await Bun.write(`${outDir}/index.html`, htmlContent);

  console.log("✅ Build complete!");
  console.log(`   Output: ${outDir}`);

  return outDir;
}

function serveHttp(workspacePath: string, outDir: string, role: string) {
  console.log("🚀 Running server...");
  Bun.serve({
    port: 7500,
    idleTimeout: 255,
    routes: {
      "/": () => new Response(Bun.file(`${outDir}/index.html`)),
      "/api/llm-stream": async (req) => {
        const url = new URL(req.url);
        const userPrompt = url.searchParams.get("userPrompt");

        if (!userPrompt) {
          return new Response("Missing userPrompt parameter", { status: 400 });
        }

        const stream = new ReadableStream({
          async start(controller) {
            try {
              const agentStream = await runAgent(workspacePath, userPrompt, role);
              let sentMessageCount = 0;

              for await (const stateUpdate of agentStream) {
                // LangGraph stream 返回的是 { nodeName: nodeState } 格式
                const nodeStates = Object.values(stateUpdate);
                if (nodeStates.length === 0) continue;

                const state: any = nodeStates[0];
                const messages = state.messages || [];

                // 只发送新增的消息
                for (let i = sentMessageCount; i < messages.length; i++) {
                  const message = messages[i];
                  const messageType = message._getType();

                  let content = "";

                  if (messageType === "human") {
                    content = message.content;
                  } else if (messageType === "ai") {
                    if (message.content) {
                      content = message.content;
                    } else if (message.tool_calls && message.tool_calls.length > 0) {
                      content = message.tool_calls.map((v: any) => v.name).join(", ");
                    }
                  } else if (messageType === "tool") {
                    content = message.name || "";
                  }

                  controller.enqueue(`[${messageType}]: ${content}\n\n`);
                }

                sentMessageCount = messages.length;
              }

              controller.enqueue("[DONE]\n\n");
              controller.close();
            } catch (error) {
              controller.enqueue(`error: ${JSON.stringify({ error: String(error) })}\n\n`);
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      },
      "/api/get-workspace-info": async (req) => {
        try {
          // 读取所有 states
          const statesData = await readAllStates(workspacePath);
          const stateIds = Object.keys(statesData.states || {});

          // 读取所有 types
          const typesData = await readAllTypes(workspacePath);
          const typeIds = Object.keys(typesData.types || {});

          // 读取所有 algorithms
          const algorithmsData = await readAllAlgorithms(workspacePath);
          const algorithmIds = Object.keys(algorithmsData.algorithms || {});

          // 读取所有 flows
          const flowsData = await readAllFlows(workspacePath);
          const flowIds = Object.keys(flowsData.flows || {});

          // 为每个 flow 生成 SVG
          const viewOutDir = `${import.meta.dir}/../view/out`;
          for (const flowId of flowIds) {
            try {
              const flowCode = await readFlowCodeById(workspacePath, flowId);
              await renderD2ToSVGContent(flowCode, viewOutDir, flowId);
              console.log(`✅ Rendered flow: ${flowId}`);
            } catch (error) {
              console.error(`❌ Failed to render flow ${flowId}: ${error}`);
            }
          }

          // 构建响应
          const response = {
            stateIds,
            typeIds,
            algorithmIds,
            flowIds,
          };

          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: String(error) }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }
      },
      "/*": (req) => {
        const url = new URL(req.url);
        const filePath = url.pathname;
        return new Response(Bun.file(`${outDir}${filePath}`));
      },
    },
  });

  console.log("✅ Server running at http://localhost:7500");
}

function parseArgs(): { workspacePath: string; role: string } {
  const args = Bun.argv.slice(2);
  let workspacePath: string | undefined;
  let role = "architect";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--role" || arg === "-r") {
      // 下一个参数是角色
      if (i + 1 < args.length && args[i + 1]) {
        role = args[i + 1]!;
        i++; // 跳过下一个参数
      } else {
        console.error("Error: --role/-r requires a value");
        process.exit(1);
      }
    } else if (!workspacePath) {
      // 第一个非选项参数是 workspacePath
      workspacePath = arg;
    }
  }

  if (!workspacePath) {
    console.error("Usage: graphicode [--role|-r <role>] <workspacePath>");
    console.error("       graphicode <workspacePath> [--role|-r <role>]");
    console.error("");
    console.error("Options:");
    console.error("  --role, -r    Agent role (default: architect)");
    console.error("");
    console.error("Examples:");
    console.error("  graphicode .");
    console.error("  graphicode ./my-project");
    console.error("  graphicode --role architect .");
    console.error("  graphicode . --role juniorEngineer");
    console.error("  graphicode -r architect ./my-project");
    process.exit(1);
  }

  return { workspacePath: workspacePath!, role };
}

/* Main */

const { workspacePath, role } = parseArgs();

console.log(`Working directory: ${workspacePath}`);
console.log(`Agent role: ${role}\n`);

const outDir = await buildView();
serveHttp(workspacePath, outDir, role);
