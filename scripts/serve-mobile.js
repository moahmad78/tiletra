const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "..", "intrihub-mobile", "dist");
const PORT = 5000;

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  let filePath = path.join(DIST_DIR, urlPath);

  // If root or file doesn't exist, SPA fallback to index.html
  if (urlPath === "/" || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
      return;
    }

    if (ext === ".html") {
      const htmlStr = content.toString("utf8").replace("<script src=", '<script type="module" src=');
      content = Buffer.from(htmlStr, "utf8");
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Mobile app web build listening on http://localhost:${PORT}`);
});
