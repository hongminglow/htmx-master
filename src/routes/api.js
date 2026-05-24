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
      // Demonstrate HX-Reswap and HX-Retarget: the form's own hx-target is
      // "#items-body" with hx-swap="beforeend", which is correct for a new
      // row but wrong for a validation error. The server overrides both so
      // the error renders into the dedicated form-error region instead of
      // appending a fake table row.
      res
        .status(422)
        .set("HX-Retarget", "#item-form-error")
        .set("HX-Reswap", "innerHTML");
      renderFragment(req, res, "partials/crud/form-error", {
        message: "Name and owner are required before the row can be added."
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

  // HX-Trigger JSON payload demo. The response carries no body; the client
  // listens for the "notify" event and reads the structured payload.
  // This is the second toast-delivery pattern (no follow-up GET round trip).
  app.post("/api/notify", requireAuth, (req, res) => {
    const kind = req.query.kind === "warning" ? "warning" : "success";
    const payload = {
      notify: {
        kind,
        title: kind === "warning" ? "Heads up" : "Action complete",
        message:
          kind === "warning"
            ? "Server emitted a warning event without a body."
            : "Server emitted a success event without a body."
      }
    };
    res.set("HX-Trigger", JSON.stringify(payload)).status(204).send("");
  });

  // Deliberate failure for the global response-error toast demo.
  // ?status=4 returns 422 so the response-targets retarget path runs.
  // ?status=5 returns 503 so the global htmx:responseError handler runs.
  app.get("/api/diagnostics/error", requireAuth, (req, res) => {
    if (req.query.status === "4") {
      res.status(422).send("<p class=\"alert alert-error\">Validation rejected this request.</p>");
      return;
    }
    res.status(503).send("Service unavailable for this demo request.");
  });
}

module.exports = { registerApiRoutes };
