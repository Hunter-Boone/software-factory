const test = require("node:test");
const assert = require("node:assert");
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
    assert.deepEqual(await res.json(), { status: "ok" });
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
