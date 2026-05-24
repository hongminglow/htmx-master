const path = require("node:path");
const crypto = require("node:crypto");
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

  // Tell intermediaries (CDNs, proxies) that the response can vary based on
  // whether htmx made the request. Without this, a fragment response can be
  // cached and served back to a normal full-page request, or vice versa.
  app.use((req, res, next) => {
    res.set("Vary", "HX-Request");
    next();
  });

  // Issue a CSRF token per session. The client picks it up from the
  // <meta name="csrf-token"> tag and forwards it on every htmx request via
  // the htmx:configRequest event. Real apps should also _verify_ the token
  // on state-changing routes; that enforcement is intentionally minimal here
  // so the demo stays focused on the wiring pattern.
  app.use((req, res, next) => {
    if (req.session && !req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    }
    next();
  });

  registerDashboardRoutes(app);
  registerAuthRoutes(app);
  registerApiRoutes(app);

  return app;
}

const app = createApp();

module.exports = { app, createApp, resetDemoState };
