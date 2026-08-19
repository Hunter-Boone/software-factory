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
};

module.exports = { metrics };
