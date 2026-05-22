const { app, resetDemoState } = require("./src/app");
const { listenWithFallback } = require("./src/lib/listen");

const PORT = Number(process.env.PORT || 3000);

if (require.main === module) {
  listenWithFallback(app, PORT, process.env.PORT ? 0 : 10);
}

module.exports = { app, resetDemoState };
