// Request counters, keyed by "METHOD /path".
// Deliberately simple: a plain object incremented on every request.
const counts = Object.create(null);

const metrics = {
  record(method, pathname) {
    const key = `${method} ${pathname}`;
    counts[key] = (counts[key] || 0) + 1;
  },

  raw() {
    return { counts: { ...counts } };
  },

  reset() {
    for (const key of Object.keys(counts)) delete counts[key];
  },

  summary() {
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    const routes = Object.entries(counts).map(([key, count]) => {
      const [method, ...pathParts] = key.split(" ");
      const path = pathParts.join(" ");
      return { method, path, count };
    }).sort((a, b) => b.count - a.count);
    return { total, routes };
  },
};

module.exports = { metrics };
