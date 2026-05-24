# Htmx Unleashed

`Htmx Unleashed` is a server-rendered demo app that shows how far htmx can go without adding a client-side JavaScript framework.

The app uses:

- Express for HTTP routes and session handling
- EJS for full-page templates and HTML fragments
- htmx for browser interactions through HTML attributes
- A small client script (`public/js/htmx-app.js`) for the four things attributes can't express cleanly: CSRF, custom confirm, global error toast, and JSON-payload event listening
- Vanilla CSS for layout, themes, loading states, transitions, modal/toast styling, and responsive behavior
- In-memory demo data for users, CRUD rows, metrics, search results, and feed activity

The key idea is simple: the browser sends normal HTTP requests, and the server responds with HTML, not JSON. htmx decides where that returned HTML should be swapped into the page.

## Why htmx Works This Way

htmx leans into two ideas that frame everything else in this app:

- **HATEOAS — the server returns the next correct UI as HTML.** The client doesn't reconstruct UI from a JSON model. State transitions are encoded directly in the response: which row to replace, what swap mode to use, where to push history. The browser is a renderer of server-driven decisions.
- **Locality of Behaviour (LoB).** Every htmx attribute lives on the element it controls. The trigger, target, swap, URL, and confirm copy all sit together in the same HTML tag. You read one element and know exactly what it does, instead of jumping between a JSX file, a hook, a reducer, and an API client.

If those two ideas resonate, the rest of the architecture falls out naturally: keep state on the server, return HTML, let small attributes drive the interactions.

## What htmx Costs (And Doesn't)

- **Payload:** htmx 2.0 is ~14 KB gzipped. No bundler, no hydration step, no client-side router. The first HTML response is the rendered UI, not a shell waiting for JavaScript.
- **Build:** zero. There is no Vite, Webpack, esbuild, or transpiler in this project. `views/` files are plain EJS, served straight by Express.
- **Mental model:** state lives on the server. UI state that browsers traditionally own (current tab, current sort, current filter) is encoded in the URL or session and re-rendered on every interaction.
- **Tradeoff:** every interaction is a network round trip. For most CRUD/dashboard interactions that is fine; for editor-style apps where the browser owns a lot of in-flight state, a client framework still wins (see "When htmx Is Not The Right Fit" below).

## Progressive Enhancement

The login form in this repo is a normal `<form action="/auth/login" method="post">` with htmx attributes layered on top. If the htmx script fails to load or JavaScript is disabled, the browser still posts the form and the server still renders the result. This is `htmx`'s most underrated property — it sits **on** HTML rather than replacing it.

That said, not every feature in this showcase degrades to a usable form: lazy widgets, polling, infinite feed, OOB updates, and toasts assume htmx is running. Treat progressive enhancement as a goal you opt into per feature, not a free guarantee.

## Quick Start

You start one server only.

There is no separate Vite/React/frontend dev server in this project. Express serves everything:

- full pages such as `/login` and `/dashboard`
- htmx fragment routes such as `/api/search` and `/api/widget/:id`
- static CSS from `public/css/style.css`
- the small client glue from `public/js/htmx-app.js`
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
user  / user123
```

For htmx attribute syntax and feature-by-feature examples, see [HTMX_REFERENCE.md](./HTMX_REFERENCE.md).

## What The Product Demonstrates

This app is structured as a product-style htmx showcase. Each section demonstrates a real interaction pattern.

| Area                   | htmx capability                                       | What it shows                                                                        |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Login form             | `hx-post`, `HX-Redirect`, `hx-target`, `hx-indicator` | Submit credentials, show validation errors, redirect after a successful session.     |
| Username check         | `hx-get`, debounced trigger, `hx-sync`                | Debounced server validation; old in-flight requests are cancelled on new keystrokes. |
| Password strength      | `hx-post`, debounced trigger                          | Field-level feedback rendered by the server.                                         |
| Remember-me info       | `hx-get`, `hx-swap="innerHTML transition:true"`       | Toggle-driven explanatory content with a View Transition.                            |
| Registration wizard    | `hx-get`, fragment swaps                              | Multi-step form screens loaded from the server.                                      |
| Lazy widgets           | `hx-trigger="load"`                                   | Dashboard tiles that hydrate themselves after page load.                             |
| Infinite feed          | `hx-trigger="revealed"`                               | A sentinel loads the next page when it scrolls into view.                            |
| Live search            | `hx-get`, debounced trigger, `hx-sync`                | Search results without client-side state and without race conditions.                |
| CRUD table             | `hx-post`, `hx-put`, `hx-delete`, `hx-confirm`        | Add, edit, and delete rows inline.                                                   |
| Custom delete confirm  | `htmx:confirm` event                                  | Replaces `window.confirm()` with a styled dialog.                                    |
| Form-error retarget    | `HX-Reswap`, `HX-Retarget`                            | Server overrides the swap target on validation failure.                              |
| Count updates          | `hx-swap-oob`                                         | A row response also updates a separate item count outside the target.                |
| Tabs                   | `hx-get`, `hx-push-url`, transitions                  | Tab content and active tab state are returned as HTML.                               |
| Polling stats          | `hx-trigger="every 2s"`                               | Timed refreshes for live counters.                                                   |
| Polling pause/resume   | Fragment replacement                                  | Swapping the polling panel removes or restores the timed trigger.                    |
| Modal                  | `hx-get`, `hx-target`                                 | Server-rendered dialog markup loaded on demand.                                      |
| Toast (string trigger) | `HX-Trigger`, `hx-swap="none"`                        | A response header fires an event, then another htmx listener fetches the toast.      |
| Toast (JSON payload)   | `HX-Trigger` (JSON), `hx-swap="none"`                 | Server emits the full toast payload in the trigger; no follow-up GET.                |
| Theme toggle           | `hx-put`, `HX-Trigger`, server session                | The server stores the theme and triggers a CSS variable refresh.                     |
| Sortable table         | Query params, `hx-include`, `hx-trigger="change"`     | Headers and filters request a re-rendered table region.                              |
| Status retargeting     | `htmx:beforeSwap` + `data-target-4xx`                 | A 30-line equivalent of the response-targets extension.                              |
| Global error toast     | `htmx:responseError`, `htmx:sendError`                | Network and server errors surface as toasts without per-call wiring.                 |

## Mental Model For React Developers

In React, you usually think in terms of client components, local state, props, effects, and API calls returning JSON.

In this app, the split is different:

| React habit                  | htmx/EJS equivalent here                                  |
| ---------------------------- | --------------------------------------------------------- |
| Component                    | EJS partial in `views/partials/`                          |
| Page component               | EJS page in `views/`                                      |
| Layout component             | `views/layout.ejs`                                        |
| API route returning JSON     | Express route returning rendered HTML                     |
| `useState` for UI state      | Server session, URL/query params, or in-memory demo state |
| `useEffect` for loading data | `hx-trigger="load"` or another htmx trigger               |
| Event handler like `onClick` | HTML attribute like `hx-get`, `hx-post`, `hx-delete`      |
| Conditional render           | Server chooses which partial to render                    |
| Client-side list update      | Server returns one row, table, or OOB fragment            |
| Context provider             | Server session + render locals                            |
| Route loader                 | The Express route itself                                  |

The browser is not responsible for rebuilding the UI from JSON. The server already knows how the UI should look, so it sends the ready-to-insert HTML.

## Project Structure

```text
.
├── server.js
├── package.json
├── src/
│   ├── app.js
│   ├── data/demoStore.js
│   ├── lib/{listen,rendering,theme}.js
│   ├── middleware/auth.js
│   └── routes/{api,auth,dashboard}.js
├── public/
│   ├── css/style.css
│   └── js/htmx-app.js
├── views/
│   ├── layout.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   └── partials/
│       ├── auth/
│       ├── crud/
│       ├── dashboard/        # widgets, tabs, polling, theme, advanced
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

- `src/app.js`: Express app, middleware, static files, route registration. Issues a per-session CSRF token and sets `Vary: HX-Request` globally.
- `src/data/demoStore.js`: in-memory demo data and state update helpers.
- `src/routes/auth.js`: login, logout, validation, and registration wizard routes.
- `src/routes/dashboard.js`: root redirect and full dashboard page.
- `src/routes/api.js`: htmx fragment endpoints.
- `src/middleware/auth.js`: auth guard for protected routes and htmx redirects.
- `src/lib/rendering.js`: shared full-page and fragment render helpers.
- `src/lib/theme.js`: dark/light CSS variable generation, including a radius and shadow scale.
- `src/lib/listen.js`: port fallback logic for local startup.

The `views/` folder owns server-rendered HTML:

- `views/layout.ejs`: shared HTML document shell with the CSRF meta tag, theme variables, htmx core, and the small client glue script.
- `views/login.ejs`, `views/dashboard.ejs`: full-page views.
- `views/partials/dashboard/advanced.ejs`: live demos of the JSON-payload trigger, status retargeting, and custom confirm dialog.
- Other partials are grouped by feature.

`public/js/htmx-app.js` is the small client-side glue. It is intentionally short and limited to escape hatches that don't fit on a single attribute. See [HTMX_REFERENCE.md](./HTMX_REFERENCE.md) Sections 11 and 14.

## How Rendering Works

Two render paths in `src/lib/rendering.js`.

`renderPage(req, res, view, data)` renders a complete page:

1. Render a page such as `login.ejs` or `dashboard.ejs`.
2. Inject that page output into `layout.ejs`.
3. Send a full HTML document.

Used for routes like:

```text
GET /login
GET /dashboard
```

`renderFragment(req, res, view, data)` renders only a partial:

1. Render one EJS partial.
2. Send only the HTML needed for one page region.

Used for routes like:

```text
GET /api/search
GET /api/widget/:id
GET /api/modal/details
PUT /api/preferences/theme
```

That distinction is important. Full pages are for navigation. Fragments are for htmx swaps.

## Content Negotiation

Because htmx sets `HX-Request: true` on every request, the same URL can serve a JSON API client and an htmx browser:

```js
app.get("/items", (req, res) => {
  if (req.get("HX-Request")) {
    return renderFragment(req, res, "partials/items-table");
  }
  res.json(store.getItems());
});
```

When you do this, set `Vary: HX-Request` so caches don't serve a fragment to a non-htmx caller (or vice versa). This repo applies that header globally in `src/app.js`.

## Why All The View Files Are `.ejs`

`.ejs` means Embedded JavaScript template — server-side HTML templating with small bits of JS expression. It is not the same thing as an ES module; the names are easy to confuse.

EJS files are not imported by the browser. Express renders them on the server, turns them into HTML strings, and sends that HTML to the browser.

```ejs
<h1><%= currentUser.name %></h1>
<%- include("partials/dashboard/theme-toggle") %>
```

This is "embedded JavaScript in HTML templates", not "embedded CSS/style in JS." CSS still lives in `public/css/style.css`.

We use EJS here because it fits the htmx style well: server returns HTML directly, partials are easy to render independently, Express supports it with very little setup, no frontend build step, templates stay close to the HTML that htmx swaps.

This is not the only valid choice. htmx works with any backend that can return HTML: Rails ERB, Django templates, Jinja, Go templates, Phoenix HEEx, Laravel Blade, JSX on the server, or plain string rendering.

## Why Not Use `type: "module"` In `package.json`

This project intentionally uses CommonJS:

```js
const express = require("express");
module.exports = { app, resetDemoState };
```

That is why `package.json` does not set `"type": "module"`.

This is a pragmatic Express demo decision, not an htmx rule. CommonJS keeps the code familiar, lets Node's built-in test runner require the app directly, and avoids any build step. Using ESM is fine; htmx does not care because it only sees the HTML response in the browser.

## Coding Decisions

### Server owns UI state

Demo data lives in `src/data/demoStore.js`: users, items, stats, activity feed, sortable rows, latest toast. In production these would move to a database or service layer. For this showcase, in-memory data keeps the htmx mechanics visible.

### Views are split by page vs partial

Top-level views (`layout.ejs`, `login.ejs`, `dashboard.ejs`) are pages. Everything in `views/partials/` is a swappable region returned by an `/api/...` route.

### Routes return HTML instead of JSON

Example: `/api/search` filters the corpus and renders `views/partials/search/search-results.ejs`. The browser receives HTML, not JSON. That is the core htmx tradeoff: less client state and less client code, in exchange for making the server responsible for UI rendering.

### htmx is served locally

The app depends on the official `htmx.org` package and serves `/vendor/htmx.min.js`. No CDN dependency for the core. Extensions (idiomorph, head-support, response-targets, sse, ws) are intentionally **not** bundled — they're documented in [HTMX_REFERENCE.md](./HTMX_REFERENCE.md) Section 12 as opt-in additions.

### A small client script earns its keep

`public/js/htmx-app.js` (~210 lines, no dependencies) handles four things that don't fit cleanly in attributes:

1. **CSRF**: forwards the per-session token via the `htmx:configRequest` event.
2. **Custom confirm dialog**: replaces `window.confirm()` via the `htmx:confirm` event. Buttons can decorate the dialog with `data-confirm-ok`, `data-confirm-cancel`, `data-confirm-tone="danger"`.
3. **Global error toast**: `htmx:responseError` and `htmx:sendError` push a toast so individual buttons don't have to handle failure.
4. **HX-Trigger JSON payload**: the `notify` event listener renders toasts straight from the server's event payload, no follow-up GET.

The same file also includes a 30-line equivalent of the `response-targets` extension: it reads `data-target-4xx`, `data-target-5xx`, `data-target-error` on the trigger and redirects 4xx/5xx swaps accordingly.

### CSS handles visual behavior

`public/css/style.css` contains layout, dark/light theme variables (a radius and shadow scale, accessible focus rings, hover states), responsive behavior, loading skeletons, htmx request-state classes, modal/confirm/toast presentation, and reduced-motion handling. There is no frontend framework-specific styling system.

## How To Add A New htmx Feature

Use this pattern:

1. Add a partial in `views/partials/`.
2. Add an Express route that renders that partial.
3. Add htmx attributes to the triggering element.
4. Decide the swap target and swap strategy.
5. Add a focused test if the behavior is important.

```html
<button hx-get="/api/example" hx-target="#example-region" hx-swap="innerHTML">
  Load example
</button>
```

```js
app.get("/api/example", requireAuth, (req, res) => {
  renderFragment(req, res, "partials/example", {
    value: "Rendered on the server"
  });
});
```

## Testing

Run:

```bash
npm test
```

The tests verify:

- anonymous users redirect to `/login`
- the login page exposes the htmx validation and wizard attributes
- failed login returns a visible validation message fragment
- an authenticated dashboard contains the planned htmx feature demos
- creating a CRUD row returns an out-of-band count update
- the architecture stays split between `server.js`, `src/`, and `views/`

The app exports `app` and `resetDemoState` from `server.js` so tests can start the Express app on a random port without depending on a long-running server.

## When htmx Is Not The Right Fit

htmx is built for "the server already knows the next correct HTML." That model is great for admin panels, dashboards, internal tools, CRUD apps, e-commerce account flows, search and filter pages, documentation portals, and most SaaS settings UIs.

It is not the right tool when the browser needs to own a lot of temporary UI state before the server is involved:

- Figma-style editors
- Notion-style collaborative editing surfaces
- rich spreadsheet/grid apps
- complex map editors
- games
- offline-first PWAs

For those, a client framework — React, Vue, Svelte, Solid — earns its keep.

## What htmx Composes With

- **Alpine.js** — declarative client-only state for menus, dropdowns, popovers, accordions, and other widgets that don't need a server round trip. Pairs cleanly with htmx; many real htmx apps use both.
- **Hyperscript** — htmx's sibling project from the same author. Inline behavior (`_="on click toggle .open"`) without writing `<script>` blocks.
- **Web Components** — encapsulate non-htmx UI (charts, editors, custom inputs) and let htmx drive the surrounding shell.
- **Vanilla `fetch()`** — for the genuinely imperative bits, drop straight into JS. htmx doesn't take over the page.

This repo intentionally avoids mixing in Alpine or Hyperscript so the htmx model alone is easy to study, but real production apps usually combine htmx with one of them.

## Production Notes

This is a showcase, not production auth or persistence.

Before using this pattern in production, replace or add:

- database-backed models
- real password hashing (bcrypt/argon2)
- **CSRF verification** on state-changing routes (this repo wires the token but does not enforce it)
- persistent sessions (Redis, database-backed store)
- structured logging
- route-level validation
- more complete integration tests

Two things this repo gets right that are easy to forget:

- **`Vary: HX-Request`** is set globally in `src/app.js`. Without it, a CDN can serve a fragment response to a full-page request (or vice versa).
- **htmx-aware auth redirects** in `src/middleware/auth.js`. Expired-session requests from htmx need `HX-Redirect`, not a 302 — the latter would leave htmx trying to swap an empty body.

Two CSP considerations that this repo papers over for demo simplicity:

- `views/layout.ejs` and `/api/preferences/theme-style` emit inline `<style>` tags. Production with a strict CSP needs `style-src` with a nonce or hash, or the theme variables moved into a static stylesheet served per-theme.
- The htmx core script is served locally. If you load extensions from a CDN, add the CDN to `script-src`.

The htmx architecture itself is unchanged in production: server-rendered pages, server-rendered fragments, and small HTML attributes for interaction.
