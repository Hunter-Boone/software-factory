const { metrics } = require("./metrics");
const pkg = require("../package.json");

const widgets = [
  { id: 1, name: "sprocket", price: 4.5 },
  { id: 2, name: "flange", price: 12.0 },
];

const routes = {
  "GET /health": () => ({
    status: "ok",
    uptime: process.uptime(),
    version: pkg.version
  }),

  "GET /widgets": () => ({ widgets }),

  "GET /widgets/count": () => ({ count: widgets.length }),

  "GET /metrics": () => metrics.raw(),

  "GET /metrics/summary": () => metrics.summary(),
};

module.exports = { routes, widgets };
