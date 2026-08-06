// Hostinger entry point shim (ESM-compatible)
// package.json has "type":"module" so this file runs as an ES Module.
// Use import() instead of require() — require is not available in ESM.
import('./dist/server.cjs');
