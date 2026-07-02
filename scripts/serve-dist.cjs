const fs = require("fs");
const http = require("http");
const path = require("path");

const port = Number(process.env.PORT || 4182);
const root = path.join(process.cwd(), "dist");
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json"
};

http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    let filePath = path.join(root, pathname === "/" ? "index.html" : pathname);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end();
      return;
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(root, "index.html");
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Preview server: http://localhost:${port}/`);
  });
