const store = require("../data/demoStore");
const { renderFragment, renderPage } = require("../lib/rendering");

function registerAuthRoutes(app) {
  app.get("/login", (req, res) => {
    if (req.session.user) {
      res.redirect("/dashboard");
      return;
    }

    renderPage(app, req, res, "login", { title: "Sign in - htmx Unleashed" });
  });

  app.get("/auth/login-form", (req, res) => {
    renderFragment(req, res, "partials/auth/login-form");
  });

  app.post("/auth/login", (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const user = store.findUser(username);

    if (!user || user.password !== password) {
      res.status(401);
      renderFragment(req, res, "partials/auth/login-result", {
        state: "error",
        title: "Login failed",
        message: "Use admin/admin123 or user/user123 for this demo."
      });
      return;
    }

    req.session.user = {
      username: user.username,
      name: user.name,
      role: user.role
    };
    req.session.theme = req.session.theme || "dark";

    res.set("HX-Redirect", "/dashboard");
    renderFragment(req, res, "partials/auth/login-result", {
      state: "success",
      title: "Session created",
      message: "Opening the htmx dashboard now."
    });
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
      renderPage(app, { ...req, session: {} }, res, "login", {
        title: "Sign in - htmx Unleashed"
      });
    });
  });

  app.get("/auth/check-username", (req, res) => {
    const username = String(req.query.username || "").trim().toLowerCase();
    const taken = store.isUsernameTaken(username);

    renderFragment(req, res, "partials/auth/username-status", {
      username,
      taken,
      available: username.length >= 3 && !taken
    });
  });

  app.post("/auth/password-strength", (req, res) => {
    const password = String(req.body.password || "");
    const score =
      Number(password.length >= 8) +
      Number(/[A-Z]/.test(password)) +
      Number(/[0-9]/.test(password)) +
      Number(/[^A-Za-z0-9]/.test(password));
    const labels = ["Empty", "Weak", "Usable", "Strong", "Excellent"];

    renderFragment(req, res, "partials/auth/password-strength", {
      score,
      label: labels[score] || labels[0]
    });
  });

  app.get("/auth/remember-me-info", (req, res) => {
    renderFragment(req, res, "partials/auth/remember-info", {
      enabled: req.query.remember === "true" || req.query.remember === "on"
    });
  });

  app.get("/auth/register/step/:step", (req, res) => {
    const step = Math.min(Math.max(Number(req.params.step) || 1, 1), 3);
    renderFragment(req, res, `partials/auth/register-step-${step}`, {
      step,
      totalSteps: 3,
      progress: `${Math.round((step / 3) * 100)}%`
    });
  });

  app.post("/auth/register", (req, res) => {
    renderFragment(req, res, "partials/auth/register-result", {
      name: String(req.body.displayName || req.body.username || "new user").trim()
    });
  });
}

module.exports = { registerAuthRoutes };
