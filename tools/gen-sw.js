const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "sw.js");
const SKIP_DIRS = new Set(["tools", "node_modules", ".git", ".github", ".vscode", ".idea", "www", "ios-native"]);
const EXT_OK = /\.(html|css|js|json|webmanifest|png|jpe?g|svg|ico|woff2?|ttf|mp3)$/i;
const FIRST = ["index.html", "manifest.webmanifest", "css/style.css"];

function walk(dir, rel, out) {
  for (const name of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, name);
    const r = rel ? rel + "/" + name : name;
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(abs, r, out);
      continue;
    }
    if (!EXT_OK.test(name)) continue;
    out.push(r);
  }
  return out;
}

const files = walk(ROOT, "", [])
  .filter(f => f !== "sw.js")
  .sort((a, b) => {
    const ia = FIRST.indexOf(a), ib = FIRST.indexOf(b);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return a.localeCompare(b);
  });

const hash = crypto.createHash("sha1");
for (const f of files) {
  const st = fs.statSync(path.join(ROOT, f));
  hash.update(f + "|" + st.size + "|" + st.mtimeMs + "\n");
}
const version = hash.digest("hex").slice(0, 10);

const list = files.map(f => '  "./' + f + '",').join("\n");

const code = [
  'const CACHE = "vl-anh-' + version + '";',
  "const ASSETS = [",
  list,
  "];",
  "",
  "self.addEventListener(\"install\", function (event) {",
  "  event.waitUntil((async function () {",
  "    const cache = await caches.open(CACHE);",
  "    try {",
  "      await cache.addAll(ASSETS);",
  "    } catch (e) {",
  "      await Promise.all(ASSETS.map(function (url) {",
  "        return cache.add(url).catch(function () { });",
  "      }));",
  "    }",
  "    await self.skipWaiting();",
  "  })());",
  "});",
  "",
  "self.addEventListener(\"activate\", function (event) {",
  "  event.waitUntil((async function () {",
  "    const keys = await caches.keys();",
  "    await Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));",
  "    await self.clients.claim();",
  "  })());",
  "});",
  "",
  "self.addEventListener(\"fetch\", function (event) {",
  "  const req = event.request;",
  "  if (req.method !== \"GET\") return;",
  "  let url;",
  "  try { url = new URL(req.url); } catch (e) { return; }",
  "  if (url.origin !== self.location.origin) return;",
  "  event.respondWith(respond(req));",
  "});",
  "",
  "async function respond(req) {",
  "  const cache = await caches.open(CACHE);",
  "  const range = req.headers.get(\"range\");",
  "  const hit = await cache.match(req.url, { ignoreVary: true, ignoreSearch: true });",
  "  if (hit && !range) return hit;",
  "  if (hit && range) {",
  "    const part = await slice(hit, range);",
  "    if (part) return part;",
  "  }",
  "  try {",
  "    const res = await fetch(req);",
  "    if (res && res.ok && !range && req.mode !== \"navigate\") cache.put(req.url, res.clone());",
  "    return res;",
  "  } catch (e) {",
  "    if (req.mode === \"navigate\") {",
  "      const page = await cache.match(\"./index.html\", { ignoreVary: true });",
  "      if (page) return page;",
  "    }",
  "    if (hit) return hit;",
  "    return new Response(\"Offline\", { status: 504, headers: { \"Content-Type\": \"text/plain; charset=utf-8\" } });",
  "  }",
  "}",
  "",
  "async function slice(res, header) {",
  "  const m = /^bytes=(\\d*)-(\\d*)$/.exec(String(header).trim());",
  "  if (!m || (m[1] === \"\" && m[2] === \"\")) return null;",
  "  const buf = await res.arrayBuffer();",
  "  const size = buf.byteLength;",
  "  let start, end;",
  "  if (m[1] === \"\") {",
  "    start = size - Number(m[2]);",
  "    end = size - 1;",
  "  } else {",
  "    start = Number(m[1]);",
  "    end = m[2] === \"\" ? size - 1 : Number(m[2]);",
  "  }",
  "  if (!isFinite(start) || !isFinite(end)) return null;",
  "  if (start < 0) start = 0;",
  "  if (end > size - 1) end = size - 1;",
  "  if (start > end) return null;",
  "  const headers = new Headers(res.headers);",
  "  headers.set(\"Content-Range\", \"bytes \" + start + \"-\" + end + \"/\" + size);",
  "  headers.set(\"Content-Length\", String(end - start + 1));",
  "  headers.set(\"Accept-Ranges\", \"bytes\");",
  "  return new Response(buf.slice(start, end + 1), { status: 206, statusText: \"Partial Content\", headers: headers });",
  "}",
  "",
].join("\n");

fs.writeFileSync(OUT, code, "utf8");

const bytes = files.reduce((s, f) => s + fs.statSync(path.join(ROOT, f)).size, 0);
console.log("sw.js: " + files.length + " file, " + (bytes / 1048576).toFixed(1) + " MB, cache=" + version);
