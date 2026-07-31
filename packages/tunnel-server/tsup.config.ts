import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  minify: false,
  external: [],
  noExternal: [/(.*)/],
})
