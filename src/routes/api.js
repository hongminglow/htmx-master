const store = require("../data/demoStore");
const { themeCss } = require("../lib/theme");
const { requireAuth } = require("../middleware/auth");
const { renderFragment, renderString } = require("../lib/rendering");

async function sendItemWithCount(app, req, res, item) {
  const row = await renderString(app, req, "partials/crud/item-row", { item });
  res.send(`${row}<span id="item-count" hx-swap-oob="innerHTML">${store.itemCount()}</span>`);
}

function registerApiRoutes(app) {
  app.get("/api/widget/:id", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/dashboard/widget-content", {
      widget: store.getWidget(req.params.id)
    });
  });

  app.get("/api/feed", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/feed/feed-page", store.pageFeed(req.query.page));
  });

  app.get("/api/search", requireAuth, (req, res) => {
    const query = String(req.query.q || "").trim();
    renderFragment(req, res, "partials/search/search-results", {
      query,
      results: store.searchFeatures(query)
    });
  });

  app.get("/api/items", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/crud/crud-table", { items: store.getItems() });
  });

  app.post("/api/items", requireAuth, async (req, res) => {
    const name = String(req.body.name || "").trim();
    const owner = String(req.body.owner || "").trim();
    const status = String(req.body.status || "Draft").trim();

    if (!name || !owner) {
      res.status(422);
      renderFragment(req, res, "partials/crud/form-error", {
        message: "Name and owner are required before htmx can append the row."
      });
      return;
    }

    const item = store.addItem({ name, owner, status });
    await sendItemWithCount(app, req, res, item);
  });

  app.get("/api/items/:id/edit", requireAuth, (req, res) => {
    const item = store.findItem(req.params.id);
    if (!item) {
      res.status(404).send("");
      return;
    }

    renderFragment(req, res, "partials/crud/item-edit-row", { item });
  });

  app.put("/api/items/:id", requireAuth, async (req, res) => {
    const item = store.updateItem(req.params.id, {
      name: String(req.body.name || "").trim(),
      owner: String(req.body.owner || "").trim(),
      status: String(req.body.status || "").trim()
    });
    if (!item) {
      res.status(404).send("");
      return;
    }

    await sendItemWithCount(app, req, res, item);
  });

  app.delete("/api/items/:id", requireAuth, (req, res) => {
    store.deleteItem(req.params.id);
    res.send(`<span id="item-count" hx-swap-oob="innerHTML">${store.itemCount()}</span>`);
  });

  app.get("/api/tabs/:name", requireAuth, (req, res) => {
    const activeTab = req.params.name;
    renderFragment(req, res, "partials/dashboard/tabs", {
      activeTab,
      tabContent: store.tabContent(activeTab)
    });
  });

  app.get("/api/stats", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/dashboard/stats-counters", { stats: store.advanceStats() });
  });

  app.get("/api/polling", requireAuth, (req, res) => {
    const pollingState = req.query.state === "paused" ? "paused" : "running";
    renderFragment(req, res, "partials/dashboard/polling-panel", {
      pollingState,
      stats: store.currentStats()
    });
  });

  app.get("/api/modal/details", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/modal/modal-dialog");
  });

  app.get("/api/modal/close", requireAuth, (req, res) => {
    res.send("");
  });

  app.get("/api/data", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/data/sortable-data-table", {
      table: store.sortedData(req.query)
    });
  });

  app.put("/api/preferences/theme", requireAuth, (req, res) => {
    req.session.theme = req.session.theme === "light" ? "dark" : "light";
    res.set("HX-Trigger", "themeChanged");
    renderFragment(req, res, "partials/dashboard/theme-toggle");
  });

  app.get("/api/preferences/theme-style", requireAuth, (req, res) => {
    res.type("html").send(`<style id="theme-vars">${themeCss(req.session.theme || "dark")}</style>`);
  });

  app.post("/api/toast/trigger", requireAuth, (req, res) => {
    store.setLatestToast(req.query.kind || "success");
    res.set("HX-Trigger", "showToast").status(204).send("");
  });

  app.get("/api/toast/latest", requireAuth, (req, res) => {
    renderFragment(req, res, "partials/toast/toast-item", { toast: store.getLatestToast() });
  });
}

module.exports = { registerApiRoutes };
