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

async function loginAsAdmin(baseUrl) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: "admin", password: "admin123" })
  });
  return response.headers.get("set-cookie");
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
    assert.match(html, /hx-get="\/auth\/register\/step\/1"/);
  });
});

test("failed login returns a visible validation message fragment", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: "admin", password: "wrong-password" })
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /role="alert"/);
    assert.match(html, /Login failed/);
    assert.match(html, /Check the username and password/);
  });
});

test("dashboard keeps htmx behavior attributes after login", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);
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
    assert.match(html, /showToast from:body/);
    assert.match(html, /themeChanged from:body/);
  });
});

test("crud item creation returns an out-of-band count update", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);

    const response = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ name: "Queue review", owner: "Nia", status: "Review" })
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /hx-swap-oob="innerHTML"/);
    assert.match(html, /Queue review/);
  });
});

/* ----------------------------------------------------------------------
 * New tests for the additions in this round.
 * -------------------------------------------------------------------- */

test("every response advertises Vary: HX-Request for cache safety", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/login`);
    const vary = response.headers.get("vary") || "";
    assert.ok(
      vary.split(",").map((s) => s.trim()).includes("HX-Request"),
      `expected Vary to include HX-Request, got: ${vary}`
    );
  });
});

test("layout exposes a CSRF meta tag and the small client script", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/login`);
    const html = await response.text();

    assert.match(html, /<meta name="csrf-token" content="[a-f0-9]{32,}">/);
    assert.match(html, /\/js\/htmx-app\.js/);
  });
});

test("debounced inputs are coordinated with hx-sync to avoid race conditions", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);
    const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: { cookie } });
    const html = await dashboard.text();

    // Live search input should cancel old in-flight requests on new keystrokes.
    assert.match(html, /hx-sync="this:replace"/);
  });
});

test("CRUD validation failure retargets to the form-error region (HX-Retarget)", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);

    const response = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/x-www-form-urlencoded"
      },
      // Missing owner - should fail validation.
      body: new URLSearchParams({ name: "", owner: "" })
    });

    assert.equal(response.status, 422);
    assert.equal(response.headers.get("hx-retarget"), "#item-form-error");
    assert.equal(response.headers.get("hx-reswap"), "innerHTML");
    const html = await response.text();
    assert.match(html, /Validation failed/);
  });
});

test("/api/notify returns 204 with HX-Trigger JSON payload", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);

    const response = await fetch(`${baseUrl}/api/notify?kind=success`, {
      method: "POST",
      headers: { cookie }
    });

    assert.equal(response.status, 204);
    const trigger = response.headers.get("hx-trigger");
    assert.ok(trigger, "HX-Trigger header missing");
    const payload = JSON.parse(trigger);
    assert.ok(payload.notify, "expected a 'notify' event in payload");
    assert.equal(payload.notify.kind, "success");
    assert.ok(payload.notify.title);
    assert.ok(payload.notify.message);
  });
});

test("/api/diagnostics/error surfaces a 503 for the global error-toast demo", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);

    const response = await fetch(`${baseUrl}/api/diagnostics/error`, { headers: { cookie } });
    assert.equal(response.status, 503);
  });
});

test("dashboard shows the advanced patterns section with status-retarget wiring", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);
    const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: { cookie } });
    const html = await dashboard.text();

    assert.match(html, /id="advanced"/);
    assert.match(html, /data-target-4xx="#advanced-error-slot"/);
    assert.match(html, /hx-post="\/api\/notify\?kind=success"/);
  });
});

test("delete button decorates the custom confirm dialog with data attributes", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await loginAsAdmin(baseUrl);
    const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: { cookie } });
    const html = await dashboard.text();

    assert.match(html, /data-confirm-ok="Delete row"/);
    assert.match(html, /data-confirm-tone="danger"/);
  });
});
