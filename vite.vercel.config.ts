import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const badgeNames = [
  "artist",
  "broadcaster",
  "founder",
  "moderator",
  "prime",
  "staff",
  "subscriber",
  "turbo",
  "vip",
];

const inlineBadgeAssets = {
  name: "inline-badge-assets",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!id.replaceAll("\\\\", "/").endsWith("/utils/chat.ts")) return null;

    return badgeNames.reduce((source, badge) => {
      const file = resolve(process.cwd(), "public", "badges", `${badge}.png`);
      const dataUri = `data:image/png;base64,${readFileSync(file).toString("base64")}`;
      return source.replace(`/badges/${badge}.png`, dataUri);
    }, code);
  },
};

const compressLargeChunks = {
  name: "compress-large-chunks",
  closeBundle() {
    const assetsDirectory = resolve(process.cwd(), "vercel-dist", "assets");

    for (const name of readdirSync(assetsDirectory)) {
      const file = resolve(assetsDirectory, name);
      if (!name.endsWith(".js") || statSync(file).size < 100_000) continue;

      const source = readFileSync(file, "utf8");
      const exportBlock = source.match(/export\{([^}]*)\};?\s*$/)?.[1];
      if (!exportBlock) throw new Error(`Could not determine exports for ${name}`);

      const exports = exportBlock.split(",").map((entry) => {
        const [original, exposed = original] = entry.trim().split(/\s+as\s+/);
        return { original, exposed };
      });
      const compressed = gzipSync(source, { level: 9 }).toString("base64");
      const namedExports = exports
        .filter(({ exposed }) => exposed !== "default")
        .map(({ exposed }) => `export const ${exposed}=loaded.${exposed};`)
        .join("");
      const defaultExport = exports.some(({ exposed }) => exposed === "default")
        ? "export default loaded.default;"
        : "";
      const wrapper = [
        `const encoded="${compressed}";`,
        "const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));",
        'const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));',
        'const source=(await new Response(stream).text()).replaceAll(\'from"./\',\'from"\'+location.origin+\'/assets/\').replaceAll(\'import"./\',\'import"\'+location.origin+\'/assets/\');',
        'const url=URL.createObjectURL(new Blob([source],{type:"text/javascript"}));',
        "const loaded=await import(url);",
        "URL.revokeObjectURL(url);",
        namedExports,
        defaultExport,
      ].join("");

      writeFileSync(file, wrapper);
    }
  },
};

export default defineConfig({
  plugins: [inlineBadgeAssets, react(), compressLargeChunks],
  publicDir: "public",
  build: {
    outDir: "vercel-dist",
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll("\\\\", "/");
          if (moduleId.includes("/node_modules/konva/")) return "konva";
          if (
            moduleId.includes("/node_modules/react-konva/") ||
            moduleId.includes("/node_modules/react-reconciler/")
          ) {
            return "react-konva";
          }
          if (
            moduleId.includes("/node_modules/react/") ||
            moduleId.includes("/node_modules/react-dom/") ||
            moduleId.includes("/node_modules/scheduler/")
          ) {
            return "react";
          }
          return null;
        },
      },
    },
  },
});
