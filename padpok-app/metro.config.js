const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Asegurarse de que config.resolver y config.resolver.sourceExts existen
config.resolver = config.resolver || {};
config.resolver.sourceExts = config.resolver.sourceExts || [];

// Añadir '.cjs' a las extensiones de source si no está presente
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Desactivar el nuevo comportamiento de "exports" de package.json
config.resolver.unstable_enablePackageExports = false;

// Ya no es necesario añadir _expoRelativeProjectRoot manualmente aquí si getDefaultConfig lo maneja
// config.transformer = {
//   ...config.transformer,
//   _expoRelativeProjectRoot: __dirname, // Esta línea se puede omitir por ahora
// };

module.exports = config;