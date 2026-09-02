export default {
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  noExternal: [/^@simulora\//],
};
