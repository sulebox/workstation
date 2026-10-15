// ============================================================
// ローカル開発サーバー:  npm run dev  →  http://localhost:3000
// ------------------------------------------------------------
// 静的ファイル + /api/*.js (Vercel と同じ handler(req, res)) を配信する。
// .env を読み込むので ANTHROPIC_API_KEY を書いておけば翻訳も動く。
// (Vercel CLI があるなら `vercel dev` でも OK)
// ============================================================
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
try {
    process.loadEnvFile(path.join(root, '.env'));
} catch {
    // .env が無くても静的ページは動く
}
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};
const HIDDEN = new Set(['node_modules', '_source', 'tests', 'api']);

let redirects = [];
try {
    redirects = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8')).redirects || [];
} catch {
    // vercel.json なし
}

async function exists(file) {
    try { return (await stat(file)).isFile(); } catch { return false; }
}

const server = http.createServer(async (req, res) => {
    const started = Date.now();
    const url = new URL(req.url, 'http://localhost');
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { pathname = '/'; }

    res.on('finish', () => {
        console.log(`${String(res.statusCode).padEnd(3)} ${req.method.padEnd(4)} ${url.pathname}  ${Date.now() - started}ms`);
    });

    // API (Vercel Functions 互換)
    if (pathname.startsWith('/api/')) {
        const name = pathname.slice(5).replace(/\/$/, '');
        const file = path.join(root, 'api', name + '.js');
        if (!/^[a-z0-9_-]+$/i.test(name) || !(await exists(file))) {
            res.statusCode = 404;
            return res.end('Not found');
        }
        try {
            const { mtimeMs } = await stat(file);
            const mod = await import(pathToFileURL(file).href + '?v=' + mtimeMs); // 編集したら再読み込み
            return await mod.default(req, res);
        } catch (err) {
            console.error(err);
            if (!res.headersSent) res.statusCode = 500;
            return res.end('Internal error');
        }
    }

    const redirect = redirects.find(r => r.source === pathname);
    if (redirect) {
        res.writeHead(redirect.permanent ? 308 : 307, { Location: redirect.destination });
        return res.end();
    }

    if (pathname.endsWith('/')) pathname += 'index.html';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.some(s => s.startsWith('.') || HIDDEN.has(s)) || /\.(mjs|md)$/.test(pathname) || pathname === '/package.json') {
        res.statusCode = 404;
        return res.end('Not found');
    }
    let file = path.join(root, ...segments);
    if (!(await exists(file)) && !path.extname(file) && (await exists(file + '.html'))) file += '.html';
    if (!(await exists(file))) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('Not found: ' + pathname);
    }
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await readFile(file));
});

server.listen(PORT, () => {
    console.log(`\n  SULE WORKSTATION BOX  →  http://localhost:${PORT}`);
    console.log(`  翻訳 API: ${process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY 読み込み済み ✓' : 'ANTHROPIC_API_KEY 未設定 (.env に書くと翻訳が使えます)'}\n`);
});
