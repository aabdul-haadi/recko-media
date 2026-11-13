// Serves the production build (.output) locally: static files from .output/public, everything else through the
// Cloudflare-style worker `fetch` handler. For measurement only; the real host is Cloudflare, whose runtime differs.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "../.output");
const port = Number(process.env.PORT ?? 4199);
const worker = (await import(pathToFileURL(path.join(root, "server/index.mjs")).href)).default;
const types = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".ico": "image/x-icon", ".txt": "text/plain" };

const compressible = /(text|javascript|json|svg|xml)/;
function send(req, res, status, headers, body) {
  const type = String(headers["content-type"] ?? "");
  if (body.length > 1024 && compressible.test(type) && /gzip/.test(String(req.headers["accept-encoding"] ?? ""))) {
    body = gzipSync(body);
    headers = { ...headers, "content-encoding": "gzip", vary: "Accept-Encoding" };
  }
  delete headers["content-length"];
  res.writeHead(status, { ...headers, "content-length": body.length });
  res.end(body);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const file = path.join(root, "public", decodeURIComponent(url.pathname));
    if (file.startsWith(path.join(root, "public")) && (await stat(file).catch(() => null))?.isFile()) {
      const body = await readFile(file);
      return send(req, res, 200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "cache-control": url.pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache" }, body);
    }
    const headers = new Headers(Object.entries(req.headers).filter(([, v]) => typeof v === "string"));
    const response = await worker.fetch(new Request(url, { method: req.method, headers }), { ASSETS: { fetch: async () => new Response("not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    return send(req, res, response.status, Object.fromEntries(response.headers), Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("server error");
  }
}).listen(port, "127.0.0.1", () => console.log("serving build on", port));
