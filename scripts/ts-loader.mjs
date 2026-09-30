// A tiny Node ESM loader that lets simulations import the game's TypeScript directly:
//   node --import ./scripts/register-ts.mjs some-sim.mjs
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

export async function resolve(specifier, context, next) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier)) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    for (const cand of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) {
      if (existsSync(cand)) return { url: pathToFileURL(cand).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const src = await readFile(fileURLToPath(url), "utf8");
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
    return { format: "module", source: out.outputText, shortCircuit: true };
  }
  return next(url, context);
}
