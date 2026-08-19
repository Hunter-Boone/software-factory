const http = require("node:http");
const { routes } = require("./routes");
const { metrics } = require("./metrics");

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const handler = routes[`${req.method} ${url.pathname}`];

    metrics.record(req.method, url.pathname);

    if (!handler) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }

    const body = handler(req, url);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => console.log(`listening on ${port}`));
}

module.exports = { createServer };
