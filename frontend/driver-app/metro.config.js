const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot  = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);
// Watch only the driver-app project + its own node_modules. Pulling in the
// monorepo root or user-app/node_modules causes two-React-copies hook errors
// because both root and user-app have their own React installations.
config.watchFolders = [];
config.resolver.blockList = [
  new RegExp(`${monorepoRoot}/artifacts/.*`),
  new RegExp(`${monorepoRoot}/.local/.*`),
  // Hard-block stray React copies from elsewhere in the monorepo so Metro
  // never accidentally bundles them alongside driver-app/node_modules/react.
  new RegExp(`${monorepoRoot}/node_modules/react/.*`),
  new RegExp(`${monorepoRoot}/node_modules/react-dom/.*`),
  new RegExp(`${monorepoRoot}/user-app/node_modules/react/.*`),
  new RegExp(`${monorepoRoot}/user-app/node_modules/react-dom/.*`),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;

// Force CJS versions of ESM-only packages on web. zustand v4 ships an ESM
// build that uses `import.meta.env`, which Metro emits raw into the web
// bundle and the browser then rejects with "Cannot use 'import.meta' outside
// a module". Pin to the driver-app's local zustand index.js (CJS).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "zustand") {
    return {
      filePath: path.resolve(projectRoot, "node_modules/zustand/index.js"),
      type: "sourceFile",
    };
  }
  if (platform === "web" && moduleName.startsWith("zustand/")) {
    const subpath = moduleName.replace("zustand/", "");
    const cjsPath = path.resolve(projectRoot, `node_modules/zustand/${subpath}.js`);
    try {
      require.resolve(cjsPath);
      return { filePath: cjsPath, type: "sourceFile" };
    } catch (_) {}
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
