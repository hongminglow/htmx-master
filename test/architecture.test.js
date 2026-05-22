const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");

test("server entry stays thin and application code is split by responsibility", () => {
  const requiredFiles = [
    "src/app.js",
    "src/data/demoStore.js",
    "src/lib/rendering.js",
    "src/lib/theme.js",
    "src/middleware/auth.js",
    "src/routes/api.js",
    "src/routes/auth.js",
    "src/routes/dashboard.js"
  ];

  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }

  const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const lineCount = serverSource.trim().split(/\r?\n/).length;

  assert.ok(lineCount <= 35, "server.js should be a thin entrypoint");
  assert.equal(serverSource.includes("app.get(\"/api"), false, "API routes should live in src/routes");
  assert.equal(serverSource.includes("const users ="), false, "demo data should live in src/data");
});
