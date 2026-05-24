const { themeCss } = require("./theme");
const { icon } = require("./icons");

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

function baseLocals(req) {
  const requestSession = req.session || {};
  return {
    currentUser: requestSession.user,
    theme: requestSession.theme || "dark",
    csrfToken: requestSession.csrfToken || "",
    title: "htmx Unleashed",
    themeCss,
    highlightText,
    statusClass,
    icon
  };
}

function renderPage(app, req, res, view, data = {}) {
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

function renderString(app, req, view, data = {}) {
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

module.exports = {
  renderFragment,
  renderPage,
  renderString
};
