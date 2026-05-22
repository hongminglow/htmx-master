const path = require("node:path");
const express = require("express");
const session = require("express-session");
const { resetDemoState } = require("./data/demoStore");
const { registerApiRoutes } = require("./routes/api");
const { registerAuthRoutes } = require("./routes/auth");
const { registerDashboardRoutes } = require("./routes/dashboard");

function createApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.get("/vendor/htmx.min.js", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "node_modules", "htmx.org", "dist", "htmx.min.js"));
  });
  app.use(
    session({
      name: "htmx.unleashed.sid",
      secret: process.env.SESSION_SECRET || "htmx-unleashed-local-demo",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax"
      }
    })
  );

  registerDashboardRoutes(app);
  registerAuthRoutes(app);
  registerApiRoutes(app);

  return app;
}

const app = createApp();

module.exports = { app, createApp, resetDemoState };
