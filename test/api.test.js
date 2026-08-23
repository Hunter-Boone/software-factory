const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { createServer } = require("../src/server");
const { metrics } = require("../src/metrics");

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET /health returns ok", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(typeof body.uptime, "number");
    assert(body.uptime >= 0);
    assert.equal(body.version, "1.0.0");
  });
});

test("GET /widgets returns the widget list", async () => {
  await withServer(async (base) => {
    const body = await (await fetch(`${base}/widgets`)).json();
    assert.equal(body.widgets.length, 2);
  });
});

test("GET /metrics counts requests by route", async () => {
  metrics.reset();
  await withServer(async (base) => {
    await fetch(`${base}/health`);
    await fetch(`${base}/health`);
    const body = await (await fetch(`${base}/metrics`)).json();
    assert.equal(body.counts["GET /health"], 2);
  });
});

test("unknown route 404s", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});

test("GET /metrics/summary returns sorted route counts with total", async () => {
  metrics.reset();
  await withServer(async (base) => {
    await fetch(`${base}/health`);
    await fetch(`${base}/health`);
    await fetch(`${base}/health`);
    await fetch(`${base}/widgets`);
    await fetch(`${base}/widgets`);
    await fetch(`${base}/widgets/count`);
    const body = await (await fetch(`${base}/metrics/summary`)).json();
    assert.equal(body.total, 7);
    assert(Array.isArray(body.routes));
    assert.equal(body.routes.length, 4);
    assert.equal(body.routes[0].method, "GET");
    assert.equal(body.routes[0].path, "/health");
    assert.equal(body.routes[0].count, 3);
    assert.equal(body.routes[1].count, 2);
    assert(body.routes[0].count >= body.routes[1].count);
    assert(body.routes[1].count >= body.routes[2].count);
  });
});

test("malformed URL returns 400", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const response = await new Promise((resolve) => {
      const req = http.request({
        host: "127.0.0.1",
        port: port,
        path: "/test",
        method: "GET",
        headers: { "host": "[invalid" }
      }, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        });
      });
      req.end();
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "malformed URL");
    assert.equal(response.body.code, "INVALID_URL");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("handler exception returns 500", async () => {
  const { routes } = require("../src/routes");
  routes["GET /error-test"] = () => {
    throw new Error("test error");
  };

  await withServer(async (base) => {
    const res = await fetch(`${base}/error-test`);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "internal server error");
    assert.equal(body.code, "HANDLER_ERROR");
  });

  delete routes["GET /error-test"];
});

test("error responses have consistent structure", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/nonexistent`);
    const body = await res.json();
    assert.ok(body.error);
    assert.equal(typeof body.error, "string");
  });
});

test("server recovers after handler error", async () => {
  const { routes } = require("../src/routes");
  routes["GET /throw"] = () => {
    throw new Error("intentional error");
  };

  await withServer(async (base) => {
    const errorRes = await fetch(`${base}/throw`);
    assert.equal(errorRes.status, 500);

    const healthRes = await fetch(`${base}/health`);
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.equal(healthBody.status, "ok");
  });

  delete routes["GET /throw"];
});
