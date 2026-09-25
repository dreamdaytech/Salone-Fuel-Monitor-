import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { ROUTE_SEO, STATIC_ARTICLE_SEO } from '../seo-routes.js';

const root = process.cwd();
const sourcePath = path.join(root, 'server.ts');
const tempPath = path.join(root, '.server-seo-build.ts');
const outPath = path.join(root, 'dist', 'server.cjs');
const source = fs.readFileSync(sourcePath, 'utf8');

function routeFileName(route) {
  if (route === '/') return 'home.html';
  return `${route.slice(1).replace(/[^a-z0-9-]+/gi, '-')}.html`;
}

// Core public routes and known published articles are served from build-time
// SEO snapshots on direct requests. This gives crawlers the correct title,
// canonical URL, description, structured data and H1 before React starts.
// Dynamic/future blog articles still fall through to the existing blog handler.
const prerenderedRoutes = { ...ROUTE_SEO, ...STATIC_ARTICLE_SEO };
const routeFiles = Object.fromEntries(
  Object.keys(prerenderedRoutes).map((route) => [route, routeFileName(route)])
);

const hostMarker = "  app.use(cors());";
const staticMarker = "    app.use(express.static(distPath));";
const catchAllMarker = "    app.get('*', (req, res) => {";

if (!source.includes(hostMarker) || !source.includes(staticMarker) || !source.includes(catchAllMarker)) {
  throw new Error('[SEO] Could not find the expected production routing markers in server.ts.');
}

const canonicalHostMiddleware = `  // SEO canonical-host normalization for Hostinger production traffic.\n  // Consolidate www and trailing-slash duplicates onto the preferred HTTPS host.\n  // 308 preserves the HTTP method for API requests as well as normal page requests.\n  app.use((req, res, next) => {\n    const host = String(req.headers.host || '').toLowerCase().split(':')[0];\n    const queryIndex = req.originalUrl.indexOf('?');\n    const pathname = queryIndex >= 0 ? req.originalUrl.slice(0, queryIndex) : req.originalUrl;\n    const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';\n    const normalizedPath = pathname.length > 1 ? pathname.replace(/\\/+$/, '') : pathname;\n    const normalizedUrl = normalizedPath + query;\n\n    if (host === 'www.salonefuelmonitor.com' || normalizedPath !== pathname) {\n      return res.redirect(308, 'https://salonefuelmonitor.com' + normalizedUrl);\n    }\n\n    return next();\n  });\n\n`;

const snapshotMiddleware = `    // SEO Phase 1: serve build-time route-specific HTML snapshots before the static SPA shell.\n    const SEO_ROUTE_FILES: Record<string, string> = ${JSON.stringify(routeFiles, null, 2)};\n\n    app.get(Object.keys(SEO_ROUTE_FILES), (req, res, next) => {\n      const pathname = req.path === '/' ? '/' : req.path.replace(/\\/+$/, '');\n      const fileName = SEO_ROUTE_FILES[pathname];\n      if (!fileName) return next();\n      const snapshotPath = path.join(distPath, '_seo', fileName);\n      if (!fs.existsSync(snapshotPath)) return next();\n      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');\n      return res.sendFile(snapshotPath);\n    });\n\n`;

const notFoundGuard = `    // Return a real HTTP 404 for unknown routes instead of a homepage-like soft 404.\n    app.get('*', (req, res, next) => {\n      const pathname = req.path === '/' ? '/' : req.path.replace(/\\/+$/, '');\n      const knownPrivateRoutes = new Set([\n        '/login', '/signup', '/register', '/profile', '/onboarding', '/location-picker',\n        '/dashboard', '/my-garage', '/donate/success', '/donate/cancel'\n      ]);\n      const isKnownAppRoute =\n        Boolean(SEO_ROUTE_FILES[pathname]) ||\n        knownPrivateRoutes.has(pathname) ||\n        pathname.startsWith('/admin') ||\n        pathname.startsWith('/transport-prices/') ||\n        pathname.startsWith('/blog/');\n\n      if (isKnownAppRoute) return next();\n\n      const notFoundPath = path.join(distPath, '404.html');\n      if (fs.existsSync(notFoundPath)) {\n        res.setHeader('X-Robots-Tag', 'noindex, nofollow');\n        return res.status(404).sendFile(notFoundPath);\n      }\n\n      return res.status(404).send('Not Found');\n    });\n\n`;

let transformed = source.replace(hostMarker, `${canonicalHostMiddleware}${hostMarker}`);
transformed = transformed.replace(staticMarker, `${snapshotMiddleware}${staticMarker}`);
transformed = transformed.replace(catchAllMarker, `${notFoundGuard}${catchAllMarker}`);

// index.html now follows the HTML-standard Twitter `name=` attribute. Keep the
// existing server-side blog crawler injection compatible with those tags.
transformed = transformed.replaceAll('meta property="twitter:', 'meta name="twitter:');

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
