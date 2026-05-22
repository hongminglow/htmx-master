# htmx Unleashed

`htmx Unleashed` is a server-rendered demo app that shows how far htmx can go without adding a client-side JavaScript framework.

The app uses:

- Express for HTTP routes and session handling
- EJS for full-page templates and HTML fragments
- htmx for browser interactions through HTML attributes
- Vanilla CSS for layout, themes, loading states, transitions, modal/toast styling, and responsive behavior
- In-memory demo data for users, CRUD rows, metrics, search results, and feed activity

The key idea is simple: the browser sends normal HTTP requests, and the server responds with HTML, not JSON. htmx decides where that returned HTML should be swapped into the page.

## Quick Start

You start one server only.

There is no separate Vite/React/frontend dev server in this project. Express serves everything:

- full pages such as `/login` and `/dashboard`
- htmx fragment routes such as `/api/search` and `/api/widget/:id`
- static CSS from `public/`
- the official htmx browser script from `/vendor/htmx.min.js`

The browser receives HTML from that same Express server and htmx swaps fragments into the current page.

Install dependencies:

```bash
bun install
```

Start the server:

```bash
bun run start
```

The package also includes npm-compatible scripts:

```bash
npm start
npm test
```

If port `3000` is already in use, the server tries the next available port up to `3010`.

Demo accounts:

```text
admin / admin123
user / user123
```

For htmx attribute syntax and feature-by-feature examples, see [HTMX_REFERENCE.md](./HTMX_REFERENCE.md).

## What The Product Demonstrates

This app is structured as a product-style htmx showcase. Each section demonstrates a real interaction pattern.

| Area | htmx capability | What it shows |
| --- | --- | --- |
| Login form | `hx-post`, `HX-Redirect`, `hx-target`, `hx-indicator` | Submit credentials, show validation errors, and redirect after a successful session. |
| Username check | `hx-get`, `hx-trigger="keyup changed delay:500ms"` | Debounced server validation while typing. |
| Password strength | `hx-post`, `hx-trigger="keyup changed delay:300ms"` | Field-level feedback rendered by the server. |
| Remember me info | `hx-get`, `hx-swap="innerHTML transition:true"` | Toggle-driven explanatory content. |
| Registration wizard | `hx-get`, fragment swaps | Multi-step form screens loaded from the server. |
| Lazy widgets | `hx-trigger="load"` | Dashboard tiles that hydrate themselves after page load. |
| Infinite feed | `hx-trigger="revealed"` | A sentinel loads the next page when it scrolls into view. |
| Live search | `hx-get`, debounced triggers | Search results update without client-side state management. |
| CRUD table | `hx-post`, `hx-put`, `hx-delete`, `hx-confirm` | Add, edit, and delete rows inline. |
| Count updates | `hx-swap-oob` | A row response also updates a separate item count outside the target. |
| Tabs | `hx-get`, `hx-push-url`, transitions | Tab content and active tab state are returned as HTML. |
| Polling stats | `hx-trigger="every 2s"` | Timed refreshes for live counters. |
| Polling pause/resume | Fragment replacement | Swapping the polling panel removes or restores the timed trigger. |
| Modal | `hx-get`, `hx-target` | Server-rendered dialog markup loaded on demand. |
| Toast | `HX-Trigger`, `hx-swap="none"` | A response header fires an event, then another htmx listener fetches the toast. |
| Theme toggle | `hx-put`, `HX-Trigger`, server session | The server stores the theme and triggers a CSS variable refresh. |
| Sortable table | Query params, `hx-include`, `hx-trigger="change"` | Headers and filters request a re-rendered table region. |

## Mental Model For React Developers

In React, you usually think in terms of client components, local state, props, effects, and API calls returning JSON.

In this app, the split is different:

| React habit | htmx/EJS equivalent here |
| --- | --- |
| Component | EJS partial in `views/partials/` |
| Page component | EJS page in `views/` |
| Layout component | `views/layout.ejs` |
| API route returning JSON | Express route returning rendered HTML |
| `useState` for UI state | Server session, URL/query params, or in-memory demo state |
| `useEffect` for loading data | `hx-trigger="load"` or another htmx trigger |
| Event handler like `onClick` | HTML attribute like `hx-get`, `hx-post`, `hx-delete` |
| Conditional render | Server chooses which partial to render |
| Client-side list update | Server returns one row, table, or OOB fragment |

The browser is not responsible for rebuilding the UI from JSON. The server already knows how the UI should look, so it sends the ready-to-insert HTML.

## Project Structure

```text
.
├── server.js
├── package.json
├── src/
│   ├── app.js
│   ├── data/
│   │   └── demoStore.js
│   ├── lib/
│   │   ├── listen.js
│   │   ├── rendering.js
│   │   └── theme.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── api.js
│       ├── auth.js
│       └── dashboard.js
├── public/
│   └── css/
│       └── style.css
├── views/
│   ├── layout.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   └── partials/
│       ├── auth/
│       ├── crud/
│       ├── dashboard/
│       ├── data/
│       ├── feed/
│       ├── modal/
│       ├── search/
│       └── toast/
└── test/
    ├── architecture.test.js
    └── smoke.test.js
```

The root `server.js` is intentionally small. It imports the configured app from `src/app.js`, starts the HTTP listener when run directly, and exports the app for tests.

The `src/` folder owns server behavior:

- `src/app.js`: Express app setup, middleware, static files, route registration.
- `src/data/demoStore.js`: in-memory demo data and state update helpers.
- `src/routes/auth.js`: login, logout, validation, and registration wizard routes.
- `src/routes/dashboard.js`: root redirect and full dashboard page.
- `src/routes/api.js`: htmx fragment endpoints.
- `src/middleware/auth.js`: auth guard for protected routes and htmx redirects.
- `src/lib/rendering.js`: shared full-page and fragment render helpers.
- `src/lib/theme.js`: dark/light CSS variable generation.
- `src/lib/listen.js`: port fallback logic for local startup.

The `views/` folder owns server-rendered HTML:

- `views/layout.ejs`: shared HTML document shell.
- `views/login.ejs` and `views/dashboard.ejs`: full-page views.
- `views/partials/auth`: login, validation, remember-me, registration wizard.
- `views/partials/dashboard`: widgets, tabs, polling, theme toggle.
- `views/partials/crud`: CRUD table and row fragments.
- `views/partials/search`: live search form and results.
- `views/partials/feed`: infinite scroll feed.
- `views/partials/modal`: server-loaded modal.
- `views/partials/toast`: server-triggered toast UI.
- `views/partials/data`: sortable and filterable data table.

## How Rendering Works

There are two render paths in `src/lib/rendering.js`.

`renderPage(req, res, view, data)` renders a complete page:

1. Render a page such as `login.ejs` or `dashboard.ejs`.
2. Inject that page output into `layout.ejs`.
3. Send a full HTML document.

This is used for routes like:

```text
GET /login
GET /dashboard
```

`renderFragment(req, res, view, data)` renders only a partial:

1. Render one EJS partial.
2. Send only the HTML needed for one page region.

This is used for routes like:

```text
GET /api/search
GET /api/widget/:id
GET /api/modal/details
PUT /api/preferences/theme
```

That distinction is important. Full pages are for navigation. Fragments are for htmx swaps.

## Why All The View Files Are `.ejs`

`.ejs` means Embedded JavaScript template.

It is not the same thing as an ES module. The name is easy to confuse because both mention JavaScript, but they solve different problems.

| Thing | File type | Purpose |
| --- | --- | --- |
| EJS template | `.ejs` | Server-side HTML template with embedded JavaScript expressions. |
| ES module | usually `.js` or `.mjs` | JavaScript module syntax using `import` and `export`. |

EJS files are not imported by the browser. Express renders them on the server, turns them into HTML strings, and sends that HTML to the browser.

EJS lets the server write HTML with small bits of dynamic logic:

```ejs
<h1><%= currentUser.name %></h1>
```

It also supports includes, which is why partials work like server-side components:

```ejs
<%- include("partials/dashboard/theme-toggle") %>
```

This is "embedded JavaScript in HTML templates", not "embedded CSS/style in JS." CSS still lives in `public/css/style.css`.

We use EJS here because it fits the htmx style well:

- The server returns HTML directly.
- Partials are easy to render independently.
- Express supports it with very little setup.
- There is no frontend build step.
- Templates stay close to the HTML that htmx swaps.

This is not the only valid choice. htmx works with any backend that can return HTML: Rails ERB, Django templates, Jinja, Go templates, Phoenix HEEx, Laravel Blade, JSX on the server, or plain string rendering.

## Why Not Use `type: "module"` In `package.json`

This project intentionally uses CommonJS:

```js
const express = require("express");
module.exports = { app, resetDemoState };
```

That is why `package.json` does not set:

```json
{ "type": "module" }
```

This is a pragmatic Express demo decision, not an htmx rule.

CommonJS is still common for small Express apps because:

- Express examples and middleware examples often use `require`.
- Node's built-in test runner can require the app directly.
- There is no build step or transpilation.
- The app is server-only, so ESM does not unlock a frontend bundling benefit.
- The code stays familiar for older Node/Express conventions.

Using ESM would also be fine:

```js
import express from "express";
export { app, resetDemoState };
```

But then we would update imports, exports, and possibly some test setup. htmx does not care either way because htmx only sees the HTML response in the browser.

## Is EJS/CommonJS The Common Practice In htmx?

The common htmx practice is not "use EJS" or "use CommonJS."

htmx is backend-agnostic. It does not know or care whether the server used EJS, JSX, Blade, Django templates, Rails ERB, Go templates, or something else. htmx only receives HTML in the browser.

The common practice is:

1. Keep most UI state on the server.
2. Return HTML fragments.
3. Use normal HTTP verbs and forms.
4. Use htmx attributes to request and swap fragments.
5. Avoid duplicating the same state model in a client framework unless the UI truly needs it.

This repo uses EJS and CommonJS because they are lightweight and direct for an Express demo. A production htmx app should use the template and module system that best fits its backend.

## Coding Decisions

### Server owns UI state

Demo data lives in `src/data/demoStore.js`:

- users
- items
- stats
- activity feed
- sortable rows
- latest toast

In production, these would move to a database or service layer. For this showcase, in-memory data keeps the htmx mechanics visible.

### Views are split by page vs partial

Top-level views:

- `layout.ejs`: shared document shell, CSS, htmx script, theme style tag
- `login.ejs`: full login page
- `dashboard.ejs`: full authenticated dashboard page

Partials:

- Render small swappable regions.
- Can be returned by `/api/...` routes.
- Keep each htmx feature isolated.
- Are grouped by feature area under `views/partials/*`.

If you are coming from React, think of partials as server-rendered components that can also be used as HTTP responses.

### Routes return HTML instead of JSON

Example: `/api/search` filters the search corpus and renders `views/partials/search/search-results.ejs`.

The browser does not receive:

```json
[{ "title": "hx-get" }]
```

It receives:

```html
<article class="result-row">...</article>
```

That is the core htmx tradeoff: less client state and less client code, in exchange for making the server responsible for UI rendering.

### htmx is served locally

The app depends on the official `htmx.org` package and serves:

```text
/vendor/htmx.min.js
```

This avoids local demo breakage when CDN access is blocked. It is still official htmx, not a framework layered on top.

### CSS handles visual behavior

`public/css/style.css` contains:

- layout
- dark/light theme variables
- responsive behavior
- loading skeletons
- htmx request states
- modal and toast presentation
- reduced-motion handling

There is no frontend framework-specific styling system.

## How To Add A New htmx Feature

Use this pattern:

1. Add a partial in `views/partials/`.
2. Add an Express route that renders that partial.
3. Add htmx attributes to the triggering element.
4. Decide the swap target and swap strategy.
5. Add a focused test if the behavior is important.

Example:

```html
<button
  hx-get="/api/example"
  hx-target="#example-region"
  hx-swap="innerHTML"
>
  Load example
</button>
```

Server route:

```js
app.get("/api/example", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/example", { value: "Rendered on the server" });
});
```

## Testing

Run:

```bash
bun run test
```

or:

```bash
npm test
```

The smoke tests verify:

- anonymous users redirect to `/login`
- the login page exposes the htmx validation and wizard attributes
- an authenticated dashboard contains the planned htmx feature demos

The app also exports `app` and `resetDemoState` from `server.js` so tests can start the Express app on a random port without depending on a long-running server.

## Production Notes

This is a showcase, not production auth or persistence.

Before using this pattern in production, replace or add:

- database-backed models
- real password hashing
- CSRF protection
- persistent sessions
- structured logging
- route-level validation
- more complete integration tests

The htmx architecture can still stay the same: server-rendered pages, server-rendered fragments, and small HTML attributes for interaction.
