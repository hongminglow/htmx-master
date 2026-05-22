function listenWithFallback(app, preferredPort, fallbackAttempts) {
  const server = app.listen(preferredPort);
  server.on("listening", () => {
    console.log(`htmx Unleashed listening on http://localhost:${preferredPort}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && fallbackAttempts > 0) {
      listenWithFallback(app, preferredPort + 1, fallbackAttempts - 1);
      return;
    }
    throw error;
  });
  return server;
}

module.exports = { listenWithFallback };
