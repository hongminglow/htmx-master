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
    label: "Requests processed",
    value: "18,420",
    detail: "Workspace actions served today",
    delta: "+12.4%",
    tone: "green",
    visual: "sparkline",
    points: [42, 48, 39, 52, 60, 55, 64, 70, 68, 76, 82, 88]
  },
  swaps: {
    label: "UI updates",
    value: "7,834",
    detail: "Interface regions refreshed",
    delta: "+8.1%",
    tone: "cyan",
    visual: "ring",
    percent: 78
  },
  latency: {
    label: "Median latency",
    value: "48 ms",
    detail: "P95 response 116 ms",
    delta: "-18 ms",
    tone: "violet",
    visual: "bar",
    bars: [
      { label: "P50", value: 48, max: 200, accent: true },
      { label: "P75", value: 78, max: 200 },
      { label: "P95", value: 116, max: 200 },
      { label: "P99", value: 184, max: 200 }
    ]
  },
  sessions: {
    label: "Live sessions",
    value: "312",
    detail: "Polling, searching, editing",
    delta: "+31",
    tone: "amber",
    visual: "delta",
    breakdown: [
      { label: "Polling", value: 124 },
      { label: "Search", value: 98 },
      { label: "CRUD", value: 90 }
    ]
  }
};

const searchCorpus = [
  {
    title: "Live search",
    group: "Request",
    description: "Looks up matching features as the user types."
  },
  {
    title: "Form actions",
    group: "Forms",
    description: "Submits credentials, registrations, and new rows."
  },
  {
    title: "Inline editing",
    group: "Rows",
    description: "Updates existing records directly in the table."
  },
  {
    title: "Row deletion",
    group: "Rows",
    description: "Removes records with a confirmation step."
  },
  {
    title: "Automatic refresh",
    group: "Events",
    description: "Keeps live counters and feeds current."
  },
  {
    title: "Linked count update",
    group: "Counters",
    description: "Keeps totals aligned after row changes."
  },
  {
    title: "Notifications",
    group: "Events",
    description: "Shows follow-up alerts after an action completes."
  },
  {
    title: "Loading feedback",
    group: "Feedback",
    description: "Shows spinners and skeleton loaders during work."
  }
];

const activityFeed = Array.from({ length: 48 }, (_, index) => {
  const actions = [
    "Validated login form",
    "Updated search results",
    "Updated item count",
    "Opened inline edit row",
    "Refreshed live metrics",
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
  { id: 2, name: "Counter sync", owner: "Lin", status: "Review", updated: "9 min ago" },
  { id: 3, name: "Inline table editor", owner: "Max", status: "Active", updated: "18 min ago" },
  { id: 4, name: "Notification trigger", owner: "Tao", status: "Draft", updated: "24 min ago" }
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
    title: "Notification ready",
    message: "Workspace events can publish follow-up alerts.",
    id: Date.now()
  };
}

function findUser(username) {
  return users.find((candidate) => candidate.username === username);
}

function isUsernameTaken(username) {
  return users.some((user) => user.username === username);
}

function getWidgetIds() {
  return Object.keys(widgetMap);
}

function getWidget(id) {
  return widgetMap[id] || widgetMap.requests;
}

function pageFeed(page) {
  const pageSize = 7;
  const currentPage = Math.max(Number(page) || 1, 1);
  const start = (currentPage - 1) * pageSize;
  const activities = activityFeed.slice(start, start + pageSize);
  const hasMore = start + pageSize < activityFeed.length;
  return {
    activities,
    nextPage: currentPage + 1,
    hasMore
  };
}

function searchFeatures(query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return searchCorpus.slice(0, 5);
  }

  return searchCorpus.filter((item) =>
    `${item.title} ${item.group} ${item.description}`.toLowerCase().includes(normalizedQuery)
  );
}

function getItems() {
  return items;
}

function addItem(data) {
  const item = {
    id: nextItemId++,
    name: data.name,
    owner: data.owner,
    status: data.status,
    updated: "just now"
  };
  items.push(item);
  return item;
}

function findItem(id) {
  return items.find((candidate) => candidate.id === Number(id));
}

function updateItem(id, data) {
  const item = findItem(id);
  if (!item) {
    return null;
  }

  item.name = data.name || item.name;
  item.owner = data.owner || item.owner;
  item.status = data.status || item.status;
  item.updated = "just now";
  return item;
}

function deleteItem(id) {
  items = items.filter((candidate) => candidate.id !== Number(id));
}

function itemCount() {
  return items.length;
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

function tabContent(name) {
  const content = {
    overview: {
      eyebrow: "Overview",
      title: "Current workspace summary",
      body: "Use this view to confirm the active surface, navigation state, and current dashboard context.",
      facts: ["Focused view", "Stable URL", "Current selection"]
    },
    lifecycle: {
      eyebrow: "Activity",
      title: "Activity stays visible while work updates.",
      body: "Loading states, settled panels, and refreshed content keep the workspace readable during changes.",
      facts: ["Loading state", "Settled content", "Progress feedback"]
    },
    forms: {
      eyebrow: "Forms",
      title: "Forms stay clear and focused.",
      body: "Validation, registration steps, inline editing, and deletes share the same direct form workflow.",
      facts: ["Validation", "Registration", "Inline editing"]
    },
    headers: {
      eyebrow: "Events",
      title: "Follow-up UI updates stay coordinated.",
      body: "Actions can refresh related regions, publish notifications, and keep preferences in sync.",
      facts: ["Notifications", "Theme sync", "Related updates"]
    }
  };

  return content[name] || content.overview;
}

function dashboardData() {
  return {
    widgetIds: getWidgetIds(),
    feed: pageFeed(1),
    items: getItems(),
    activeTab: "overview",
    tabContent: tabContent("overview"),
    stats: currentStats(),
    pollingState: "running",
    table: sortedData({})
  };
}

function setLatestToast(kind) {
  latestToast = {
    id: Date.now(),
    kind,
    title: kind === "warning" ? "Review needed" : "Notification sent",
    message:
      kind === "warning"
        ? "The workspace published a warning notification."
        : "The workspace published a success notification."
  };
}

function getLatestToast() {
  return latestToast;
}

resetDemoState();

module.exports = {
  addItem,
  advanceStats,
  currentStats,
  dashboardData,
  deleteItem,
  findItem,
  findUser,
  getItems,
  getLatestToast,
  getWidget,
  isUsernameTaken,
  itemCount,
  pageFeed,
  resetDemoState,
  searchFeatures,
  setLatestToast,
  sortedData,
  tabContent,
  updateItem
};
