import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { ROUTE_SEO, STATIC_ARTICLE_SEO } from '../seo-routes.js';

const root = process.cwd();
const sourcePath = path.join(root, 'server.ts');
const tempPath = path.join(root, '.server-seo-build.ts');
const outPath = path.join(root, 'dist', 'server.cjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const allRoutes = { ...ROUTE_SEO, ...STATIC_ARTICLE_SEO };

function routeFileName(route) {
  if (route === '/') return 'home.html';
  return `${route.slice(1).replace(/[^a-z0-9-]+/gi, '-')}.html`;
}

const routeFiles = Object.fromEntries(
  Object.keys(allRoutes).map((route) => [route, routeFileName(route)])
);

const blogMarker = "    app.get('/blog/:slug', async (req, res) => {";
const catchAllMarker = "    app.get('*', (req, res) => {";

if (!source.includes(blogMarker) || !source.includes(catchAllMarker)) {
  throw new Error('[SEO] Could not find the expected production routing markers in server.ts.');
}

const snapshotMiddleware = `    // SEO Phase 1: serve build-time route-specific HTML snapshots before the SPA fallback.\n    const SEO_ROUTE_FILES: Record<string, string> = ${JSON.stringify(routeFiles, null, 2)};\n\n    app.get(Object.keys(SEO_ROUTE_FILES), (req, res, next) => {\n      const pathname = req.path === '/' ? '/' : req.path.replace(/\\/+$/, '');\n      const fileName = SEO_ROUTE_FILES[pathname];\n      if (!fileName) return next();\n      const snapshotPath = path.join(distPath, '_seo', fileName);\n      if (!fs.existsSync(snapshotPath)) return next();\n      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');\n      return res.sendFile(snapshotPath);\n    });\n\n`;

const notFoundGuard = `    // Return a real HTTP 404 for unknown routes instead of a homepage-like soft 404.\n    app.get('*', (req, res, next) => {\n      const pathname = req.path === '/' ? '/' : req.path.replace(/\\/+$/, '');\n      const knownPrivateRoutes = new Set([\n        '/login', '/signup', '/register', '/profile', '/onboarding', '/location-picker',\n        '/dashboard', '/my-garage', '/donate/success', '/donate/cancel'\n      ]);\n      const isKnownAppRoute =\n        Boolean(SEO_ROUTE_FILES[pathname]) ||\n        knownPrivateRoutes.has(pathname) ||\n        pathname.startsWith('/admin') ||\n        pathname.startsWith('/transport-prices/') ||\n        pathname.startsWith('/blog/');\n\n      if (isKnownAppRoute) return next();\n\n      const notFoundPath = path.join(distPath, '404.html');\n      if (fs.existsSync(notFoundPath)) {\n        res.setHeader('X-Robots-Tag', 'noindex, nofollow');\n        return res.status(404).sendFile(notFoundPath);\n      }\n\n      return res.status(404).send('Not Found');\n    });\n\n`;

let transformed = source.replace(blogMarker, `${snapshotMiddleware}${blogMarker}`);
transformed = transformed.replace(catchAllMarker, `${notFoundGuard}${catchAllMarker}`);

fs.writeFileSync(tempPath, transformed);

try {
  await build({
    entryPoints: [tempPath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    target: 'es2021',
    outfile: outPath,
  });
  console.log(`[SEO] Built production server with ${Object.keys(routeFiles).length} prerendered route mappings.`);
} finally {
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
}
