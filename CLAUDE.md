# widget-api

Zero-dependency Node HTTP API. No framework, no build step.

- `src/server.js` — request dispatch, looks up `"METHOD /path"` in the route table.
- `src/routes.js` — the route table. Add new routes here.
- `src/metrics.js` — in-memory request counters.
- `test/api.test.js` — `node:test`. Run with `npm test`.

Conventions: CommonJS (`require`), 2-space indent, double quotes, no external deps.
