import { join } from "path";
import { mkdir } from "fs/promises";
import { $ } from "bun";

function processD2Code(d2Code: string): string {
  const specialNodes = new Set<string>();
  const nodePattern = /[$@&]([a-zA-Z0-9_]+)/g;
  
  let match;
  while ((match = nodePattern.exec(d2Code)) !== null) {
    if (match[1]) {
      specialNodes.add(match[1]);
    }
  }
  
  const processedCode = d2Code.replace(/[$@&]([a-zA-Z0-9_]+)(?:\.[a-zA-Z0-9_]+)?/g, '$1');
  
  let header = 'direction: right\n';
  for (const nodeName of specialNodes) {
    header += `${nodeName} {\n  shape: text\n}\n`;
  }
  
  return header + '\n' + processedCode;
}

export async function renderD2ToSVG(
  d2Code: string,
  outDir: string,
  fileName: string
): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const processedCode = processD2Code(d2Code);

  const timestamp = Date.now();
  const tempD2File = join(outDir, `temp_${timestamp}.d2`);
  const outputSVGFile = join(outDir, `${fileName}.svg`);

  await Bun.write(tempD2File, processedCode);

  const result = await $`d2 -l ELK ${tempD2File} ${outputSVGFile}`.quiet();

  if (result.exitCode !== 0) {
    throw new Error(`D2 command failed: ${result.stderr}`);
  }

  try {
    await $`rm ${tempD2File}`.quiet();
  } catch (error) {
    console.warn(`Failed to delete temporary file ${tempD2File}: ${error}`);
  }
}

export async function renderD2ToSVGContent(
  d2Code: string,
  outDir: string,
  fileName: string
) {
  const processedCode = processD2Code(d2Code);
  await renderD2ToSVG(processedCode, outDir, fileName);
}
