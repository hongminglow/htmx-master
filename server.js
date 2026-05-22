const path = require("node:path");
const ejs = require("ejs");
const express = require("express");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/vendor/htmx.min.js", (req, res) => {
  res.sendFile(path.join(__dirname, "node_modules", "htmx.org", "dist", "htmx.min.js"));
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

const users = [
  {
    username: "admin",
    password: "admin123",
    name: "Admin",
    role: "Maintainer"
  },
  {
    username: "user",
    password: "user123",
    name: "Demo User",
    role: "Operator"
  }
];

const widgetMap = {
  requests: {
    label: "Fragment requests",
    value: "18,420",
    detail: "HTML responses served today",
    delta: "+12.4%",
    tone: "green"
  },
  swaps: {
    label: "DOM swaps",
    value: "7,834",
    detail: "Server-rendered updates applied",
    delta: "+8.1%",
    tone: "cyan"
  },
  latency: {
    label: "Median latency",
    value: "48 ms",
    detail: "P95 route response 116 ms",
    delta: "-18 ms",
    tone: "violet"
  },
  sessions: {
    label: "Live sessions",
    value: "312",
    detail: "Polling, searching, editing",
    delta: "+31",
    tone: "amber"
  }
};

const searchCorpus = [
  {
    title: "hx-get",
    group: "Request",
    description: "Fetches server-rendered HTML and swaps it into a target."
  },
  {
    title: "hx-post",
    group: "Forms",
    description: "Submits forms without a client framework or JSON ceremony."
  },
  {
    title: "hx-put",
    group: "REST",
    description: "Updates resources inline while preserving server ownership."
  },
  {
    title: "hx-delete",
    group: "REST",
    description: "Deletes rows, panels, and records with confirmable actions."
  },
  {
    title: "hx-trigger",
    group: "Events",
    description: "Runs requests from load, revealed, change, keyup, or timers."
  },
  {
    title: "hx-swap-oob",
    group: "Fragments",
    description: "Updates counters and remote UI regions outside the target."
  },
  {
    title: "HX-Trigger",
    group: "Headers",
    description: "Lets the server raise browser events after a response."
  },
  {
    title: "hx-indicator",
    group: "Feedback",
    description: "Connects request state to spinners and skeleton loaders."
  }
];

const activityFeed = Array.from({ length: 48 }, (_, index) => {
  const actions = [
    "Validated login form",
    "Rendered search fragment",
    "Applied out-of-band count update",
    "Swapped inline edit row",
    "Refreshed polling metrics",
    "Loaded modal details",
    "Sorted dataset by health score",
    "Persisted theme preference"
  ];
  return {
    id: index + 1,
    action: actions[index % actions.length],
    actor: index % 3 === 0 ? "admin" : "user",
    time: `${index + 2} min ago`
  };
});

const sortableRows = [
  { name: "Checkout Flow", owner: "Nia", status: "active", score: 98, volume: 4200 },
  { name: "Inventory Sync", owner: "Omar", status: "paused", score: 71, volume: 1320 },
  { name: "Search Console", owner: "Iris", status: "active", score: 89, volume: 3100 },
  { name: "Review Queue", owner: "Pax", status: "draft", score: 62, volume: 780 },
  { name: "Billing Audit", owner: "Mika", status: "active", score: 94, volume: 2150 },
  { name: "Support Inbox", owner: "Ren", status: "paused", score: 76, volume: 1880 }
];

const initialItems = [
  { id: 1, name: "Lazy widget pipeline", owner: "Ada", status: "Active", updated: "2 min ago" },
  { id: 2, name: "OOB counter sync", owner: "Lin", status: "Review", updated: "9 min ago" },
  { id: 3, name: "Inline table editor", owner: "Max", status: "Active", updated: "18 min ago" },
  { id: 4, name: "Header-triggered toast", owner: "Tao", status: "Draft", updated: "24 min ago" }
];

let items;
let nextItemId;
let statState;
let latestToast;

function resetDemoState() {
  items = initialItems.map((item) => ({ ...item }));
  nextItemId = Math.max(...items.map((item) => item.id)) + 1;
  statState = {
    requests: 18420,
    swaps: 7834,
    activeUsers: 312,
    successRate: 99.7
  };
  latestToast = {
    kind: "info",
    title: "Server event ready",
    message: "HX-Trigger can fan out follow-up htmx requests.",
    id: Date.now()
  };
}

resetDemoState();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightText(value, query) {
  const safeValue = String(value);
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return escapeHtml(safeValue);
  }

  const index = safeValue.toLowerCase().indexOf(normalizedQuery);
  if (index === -1) {
    return escapeHtml(safeValue);
  }

  const before = safeValue.slice(0, index);
  const match = safeValue.slice(index, index + normalizedQuery.length);
  const after = safeValue.slice(index + normalizedQuery.length);
  return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}

function statusClass(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function themeCss(theme) {
  if (theme === "light") {
    return `:root {
  color-scheme: light;
  --bg: #f6f8fb;
  --surface: #ffffff;
  --surface-2: #eef2f7;
  --surface-3: #e2e8f0;
  --text: #0f172a;
  --muted: #475569;
  --faint: #64748b;
  --border: rgba(15, 23, 42, 0.14);
  --strong-border: rgba(15, 23, 42, 0.24);
  --accent: #15803d;
  --accent-strong: #166534;
  --accent-soft: rgba(34, 197, 94, 0.14);
  --cyan: #0369a1;
  --violet: #6d28d9;
  --amber: #b45309;
  --danger: #b91c1c;
  --shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
}`;
  }

  return `:root {
  color-scheme: dark;
  --bg: #070a12;
  --surface: #0d1320;
  --surface-2: #121a2a;
  --surface-3: #172133;
  --text: #f8fafc;
  --muted: #aeb9ca;
  --faint: #738196;
  --border: rgba(148, 163, 184, 0.18);
  --strong-border: rgba(148, 163, 184, 0.34);
  --accent: #22c55e;
  --accent-strong: #86efac;
  --accent-soft: rgba(34, 197, 94, 0.16);
  --cyan: #22d3ee;
  --violet: #a78bfa;
  --amber: #f59e0b;
  --danger: #fb7185;
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
}`;
}

function baseLocals(req) {
  const requestSession = req.session || {};
  return {
    currentUser: requestSession.user,
    theme: requestSession.theme || "dark",
    title: "htmx Unleashed",
    themeCss,
    highlightText,
    statusClass
  };
}

function renderPage(req, res, view, data = {}) {
  const locals = { ...baseLocals(req), ...data };
  app.render(view, locals, (viewError, body) => {
    if (viewError) {
      res.status(500).send(viewError.message);
      return;
    }

    app.render("layout", { ...locals, body }, (layoutError, html) => {
      if (layoutError) {
        res.status(500).send(layoutError.message);
        return;
      }

      res.send(html);
    });
  });
}

function renderFragment(req, res, view, data = {}) {
  res.render(view, { ...baseLocals(req), ...data });
}

function renderString(req, view, data = {}) {
  return new Promise((resolve, reject) => {
    app.render(view, { ...baseLocals(req), ...data }, (error, html) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(html);
    });
  });
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    next();
    return;
  }

  if (req.get("HX-Request")) {
    res.set("HX-Redirect", "/login").status(401).send("");
    return;
  }

  res.redirect("/login");
}

function pageFeed(page) {
  const pageSize = 7;
  const currentPage = Math.max(Number(page) || 1, 1);
  const start = (currentPage - 1) * pageSize;
  const pagedItems = activityFeed.slice(start, start + pageSize);
  const hasMore = start + pageSize < activityFeed.length;
  return {
    activities: pagedItems,
    nextPage: currentPage + 1,
    hasMore
  };
}

function sortedData(query) {
  const allowedSorts = new Set(["name", "owner", "status", "score", "volume"]);
  const sort = allowedSorts.has(query.sort) ? query.sort : "name";
  const order = query.order === "desc" ? "desc" : "asc";
  const filter = query.filter || "all";
  const filteredRows =
    filter === "all" ? sortableRows : sortableRows.filter((row) => row.status === filter);

  const rows = [...filteredRows].sort((left, right) => {
    const leftValue = left[sort];
    const rightValue = right[sort];
    const result =
      typeof leftValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

    return order === "asc" ? result : -result;
  });

  return { rows, sort, order, filter };
}

function currentStats() {
  return { ...statState };
}

function advanceStats() {
  statState.requests += 23 + (statState.requests % 7);
  statState.swaps += 11 + (statState.swaps % 5);
  statState.activeUsers += statState.activeUsers % 2 === 0 ? 3 : -2;
  statState.successRate = Math.max(98.9, Math.min(99.9, statState.successRate + 0.1));
  return currentStats();
}

function dashboardData(req) {
  const feed = pageFeed(1);
  const table = sortedData({});
  return {
    widgetIds: Object.keys(widgetMap),
    feed,
    items,
    activeTab: "overview",
    tabContent: tabContent("overview"),
    stats: currentStats(),
    pollingState: "running",
    table
  };
}

function tabContent(name) {
  const content = {
    overview: {
      eyebrow: "Composition",
      title: "A page can be a state machine without client state.",
      body: "Each tab is a server-owned fragment. htmx only decides when and where the returned HTML lands.",
      facts: ["hx-get loads this panel", "hx-target scopes the swap", "hx-push-url can reflect state"]
    },
    lifecycle: {
      eyebrow: "Lifecycle",
      title: "Requests expose loading, settling, and swapping phases.",
      body: "The CSS hooks make server trips feel native: skeletons show during request, then the new fragment settles in.",
      facts: ["htmx-request", "htmx-swapping", "htmx-settling"]
    },
    forms: {
      eyebrow: "Forms",
      title: "Forms stay HTML-first.",
      body: "Validation, registration steps, inline editing, and deletes all use normal form semantics with htmx attributes.",
      facts: ["hx-post", "hx-put", "hx-delete"]
    },
    headers: {
      eyebrow: "Headers",
      title: "The server can orchestrate secondary UI updates.",
      body: "HX-Trigger lets one response raise browser events that other htmx listeners use to fetch fresh fragments.",
      facts: ["HX-Trigger", "from:body", "hx-swap='none'"]
    }
  };

  return content[name] || content.overview;
}

function registerStepData(step) {
  return {
    step,
    totalSteps: 3,
    progress: `${Math.round((step / 3) * 100)}%`
  };
}

async function sendItemWithCount(req, res, item) {
  const row = await renderString(req, "partials/item-row", { item });
  res.send(`${row}<span id="item-count" hx-swap-oob="innerHTML">${items.length}</span>`);
}

app.get("/", (req, res) => {
  res.redirect(req.session.user ? "/dashboard" : "/login");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
    return;
  }

  renderPage(req, res, "login", { title: "Sign in - htmx Unleashed" });
});

app.get("/auth/login-form", (req, res) => {
  renderFragment(req, res, "partials/login-form");
});

app.post("/auth/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const user = users.find((candidate) => candidate.username === username);

  if (!user || user.password !== password) {
    res.status(401);
    renderFragment(req, res, "partials/login-result", {
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
  renderFragment(req, res, "partials/login-result", {
    state: "success",
    title: "Session created",
    message: "Opening the htmx dashboard now."
  });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    renderPage({ ...req, session: {} }, res, "login", { title: "Sign in - htmx Unleashed" });
  });
});

app.get("/auth/check-username", (req, res) => {
  const username = String(req.query.username || "").trim().toLowerCase();
  const taken = users.some((user) => user.username === username);

  renderFragment(req, res, "partials/username-status", {
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

  renderFragment(req, res, "partials/password-strength", {
    score,
    label: labels[score] || labels[0]
  });
});

app.get("/auth/remember-me-info", (req, res) => {
  renderFragment(req, res, "partials/remember-info", {
    enabled: req.query.remember === "true" || req.query.remember === "on"
  });
});

app.get("/auth/register/step/:step", (req, res) => {
  const step = Math.min(Math.max(Number(req.params.step) || 1, 1), 3);
  renderFragment(req, res, `partials/register-step-${step}`, registerStepData(step));
});

app.post("/auth/register", (req, res) => {
  renderFragment(req, res, "partials/register-result", {
    name: String(req.body.displayName || req.body.username || "new user").trim()
  });
});

app.get("/dashboard", requireAuth, (req, res) => {
  renderPage(req, res, "dashboard", {
    title: "Dashboard - htmx Unleashed",
    ...dashboardData(req)
  });
});

app.get("/api/widget/:id", requireAuth, (req, res) => {
  const widget = widgetMap[req.params.id] || widgetMap.requests;
  renderFragment(req, res, "partials/widget-content", { widget });
});

app.get("/api/feed", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/feed-page", pageFeed(req.query.page));
});

app.get("/api/search", requireAuth, (req, res) => {
  const query = String(req.query.q || "").trim();
  const normalizedQuery = query.toLowerCase();
  const results = normalizedQuery
    ? searchCorpus.filter((item) =>
        `${item.title} ${item.group} ${item.description}`.toLowerCase().includes(normalizedQuery)
      )
    : searchCorpus.slice(0, 5);

  renderFragment(req, res, "partials/search-results", { query, results });
});

app.get("/api/items", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/crud-table", { items });
});

app.post("/api/items", requireAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const owner = String(req.body.owner || "").trim();
  const status = String(req.body.status || "Draft").trim();

  if (!name || !owner) {
    res.status(422);
    renderFragment(req, res, "partials/form-error", {
      message: "Name and owner are required before htmx can append the row."
    });
    return;
  }

  const item = {
    id: nextItemId++,
    name,
    owner,
    status,
    updated: "just now"
  };
  items.push(item);
  await sendItemWithCount(req, res, item);
});

app.get("/api/items/:id/edit", requireAuth, (req, res) => {
  const item = items.find((candidate) => candidate.id === Number(req.params.id));
  if (!item) {
    res.status(404).send("");
    return;
  }

  renderFragment(req, res, "partials/item-edit-row", { item });
});

app.put("/api/items/:id", requireAuth, async (req, res) => {
  const item = items.find((candidate) => candidate.id === Number(req.params.id));
  if (!item) {
    res.status(404).send("");
    return;
  }

  item.name = String(req.body.name || item.name).trim();
  item.owner = String(req.body.owner || item.owner).trim();
  item.status = String(req.body.status || item.status).trim();
  item.updated = "just now";
  await sendItemWithCount(req, res, item);
});

app.delete("/api/items/:id", requireAuth, (req, res) => {
  items = items.filter((candidate) => candidate.id !== Number(req.params.id));
  res.send(`<span id="item-count" hx-swap-oob="innerHTML">${items.length}</span>`);
});

app.get("/api/tabs/:name", requireAuth, (req, res) => {
  const activeTab = req.params.name;
  renderFragment(req, res, "partials/tabs", {
    activeTab,
    tabContent: tabContent(activeTab)
  });
});

app.get("/api/stats", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/stats-counters", { stats: advanceStats() });
});

app.get("/api/polling", requireAuth, (req, res) => {
  const pollingState = req.query.state === "paused" ? "paused" : "running";
  renderFragment(req, res, "partials/polling-panel", {
    pollingState,
    stats: currentStats()
  });
});

app.get("/api/modal/details", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/modal-dialog");
});

app.get("/api/modal/close", requireAuth, (req, res) => {
  res.send("");
});

app.get("/api/data", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/sortable-data-table", {
    table: sortedData(req.query)
  });
});

app.put("/api/preferences/theme", requireAuth, (req, res) => {
  req.session.theme = req.session.theme === "light" ? "dark" : "light";
  res.set("HX-Trigger", "themeChanged");
  renderFragment(req, res, "partials/theme-toggle");
});

app.get("/api/preferences/theme-style", requireAuth, (req, res) => {
  res.type("html").send(`<style id="theme-vars">${themeCss(req.session.theme || "dark")}</style>`);
});

app.post("/api/toast/trigger", requireAuth, (req, res) => {
  const kind = req.query.kind || "success";
  latestToast = {
    id: Date.now(),
    kind,
    title: kind === "warning" ? "Careful request" : "Server event received",
    message:
      kind === "warning"
        ? "This toast was requested after a 204 response header event."
        : "HX-Trigger fired, and another htmx listener fetched this toast.",
  };
  res.set("HX-Trigger", "showToast").status(204).send("");
});

app.get("/api/toast/latest", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/toast-item", { toast: latestToast });
});

if (require.main === module) {
  const preferredPort = Number(PORT);
  const listen = (port, fallbackAttempts) => {
    const server = app.listen(port);
    server.on("listening", () => {
      console.log(`htmx Unleashed listening on http://localhost:${port}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE" && fallbackAttempts > 0) {
        listen(port + 1, fallbackAttempts - 1);
        return;
      }
      throw error;
    });
  };

  listen(preferredPort, process.env.PORT ? 0 : 10);
}

module.exports = { app, resetDemoState };
