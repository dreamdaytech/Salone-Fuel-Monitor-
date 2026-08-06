// Hostinger entry point shim
// Hostinger's Express preset looks for 'server.js' at the root.
// After `npm run build`, the actual server bundle is at dist/server.cjs.
require('./dist/server.cjs');
