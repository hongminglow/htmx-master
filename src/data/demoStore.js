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
    title: kind === "warning" ? "Careful request" : "Server event received",
    message:
      kind === "warning"
        ? "This toast was requested after a 204 response header event."
        : "HX-Trigger fired, and another htmx listener fetched this toast."
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
