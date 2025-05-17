const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Permitir archivos .cjs
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}

// Desactivar el nuevo comportamiento de "exports" de package.json
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 