const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
// NativeWind metro wrapper removed — screens use StyleSheet.create() + brand.ts tokens.
// NativeWind packages remain installed for potential future migration.

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const sharedRoot = path.resolve(workspaceRoot, "shared");

const config = getDefaultConfig(projectRoot);

// Watch the shared folder outside user-app
config.watchFolders = [
  projectRoot,
  sharedRoot,
];
config.resolver.blockList = [
  new RegExp(`${workspaceRoot}/artifacts/.*`),
];

// Allow Metro to resolve modules from both user-app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force CJS versions of ESM-only packages to avoid `import.meta` issues in Metro web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "zustand") {
    return {
      filePath: path.resolve(projectRoot, "node_modules/zustand/index.js"),
      type: "sourceFile",
    };
  }
  if (platform === "web" && moduleName.startsWith("zustand/")) {
    const subpath = moduleName.replace("zustand/", "");
    const cjsPath = path.resolve(
      projectRoot,
      `node_modules/zustand/${subpath}.js`
    );
    try {
      require.resolve(cjsPath);
      return { filePath: cjsPath, type: "sourceFile" };
    } catch (_) {}
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

