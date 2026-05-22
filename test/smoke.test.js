const assert = require("node:assert/strict");
const test = require("node:test");

const { app, resetDemoState } = require("../server");

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function withServer(fn) {
  resetDemoState();
  const { server, baseUrl } = await startServer();
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("root redirects anonymous visitors to login", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`, { redirect: "manual" });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/login");
  });
});

test("login page exposes htmx-driven validation and registration", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/login`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /unpkg\.com\/htmx\.org/);
    assert.match(html, /hx-get="\/auth\/check-username"/);
    assert.match(html, /hx-post="\/auth\/password-strength"/);
    assert.match(html, /hx-get="\/auth\/register\/step\/1"/);
  });
});

test("dashboard contains the planned htmx feature demonstrations after login", async () => {
  await withServer(async (baseUrl) => {
    const login = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: "admin", password: "admin123" })
    });
    const cookie = login.headers.get("set-cookie");

    assert.equal(login.status, 200);
    assert.ok(cookie);

    const dashboard = await fetch(`${baseUrl}/dashboard`, {
      headers: { cookie }
    });
    const html = await dashboard.text();

    assert.equal(dashboard.status, 200);
    assert.match(html, /hx-trigger="load"/);
    assert.match(html, /hx-trigger="revealed"/);
    assert.match(html, /hx-trigger="every 2s"/);
    assert.match(html, /hx-delete="\/api\/items\//);
    assert.match(html, /hx-swap-oob/);
    assert.match(html, /showToast from:body/);
    assert.match(html, /themeChanged from:body/);
  });
});
