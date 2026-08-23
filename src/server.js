const http = require("node:http");
const { routes } = require("./routes");
const { metrics } = require("./metrics");

function sendError(res, statusCode, message, code) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error ${statusCode}: ${message}${code ? ` (${code})` : ""}`);

  res.writeHead(statusCode, { "content-type": "application/json" });
  const errorBody = { error: message };
  if (code) {
    errorBody.code = code;
  }
  res.end(JSON.stringify(errorBody));
}

function createServer() {
  return http.createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, `http://${req.headers.host}`);
    } catch (err) {
      sendError(res, 400, "malformed URL", "INVALID_URL");
      return;
    }

    const handler = routes[`${req.method} ${url.pathname}`];

    metrics.record(req.method, url.pathname);

    if (!handler) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }

    let body;
    try {
      body = handler(req, url);
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Handler error for ${req.method} ${url.pathname}:`, err);
      sendError(res, 500, "internal server error", "HANDLER_ERROR");
      return;
    }

    try {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] JSON serialization error for ${req.method} ${url.pathname}:`, err);
      sendError(res, 500, "serialization error", "JSON_ERROR");
    }
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => console.log(`listening on ${port}`));
}

module.exports = { createServer };
