const store = require("../data/demoStore");
const { requireAuth } = require("../middleware/auth");
const { renderPage } = require("../lib/rendering");

function registerDashboardRoutes(app) {
  app.get("/", (req, res) => {
    res.redirect(req.session.user ? "/dashboard" : "/login");
  });

  app.get("/dashboard", requireAuth, (req, res) => {
    renderPage(app, req, res, "dashboard", {
      title: "Dashboard - htmx Unleashed",
      ...store.dashboardData()
    });
  });
}

module.exports = { registerDashboardRoutes };
