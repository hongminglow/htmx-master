# htmx Attribute Reference For This Repo

This file maps the htmx syntax used in `htmx Unleashed` to the features it powers,
and covers a layer beyond — the attributes, headers, events, and extensions that
this repo intentionally introduces or leaves on the bench but documents for
production use.

The short version: htmx lets ordinary HTML elements make HTTP requests and swap
returned HTML into the page.

```html
<button
  hx-get="/api/example"
  hx-target="#result"
  hx-swap="innerHTML"
>
  Load
</button>
```

When the user clicks the button:

1. htmx sends `GET /api/example`.
2. Express returns an HTML fragment.
3. htmx puts that fragment inside `#result`.

No React state, no client-side router, no JSON parsing, and no custom `fetch()`
handler are needed for that interaction.

---

## 1. Request Attributes

### `hx-get`

Use `hx-get` when the interaction reads data or loads UI without changing
server state.

```html
<input
  name="q"
  hx-get="/api/search"
  hx-trigger="keyup changed delay:300ms"
  hx-target="#search-results"
>
```

In this repo:

- username availability check
- live search
- lazy widgets
- infinite feed pages
- tabs
- modal open/close
- sortable table refresh
- polling stats

Think of it as: "call a GET endpoint and use the returned HTML."

### `hx-post`

Use `hx-post` when submitting data that creates something, validates something,
or performs an action.

```html
<form hx-post="/auth/login" hx-target="#login-result">
  ...
</form>
```

In this repo:

- login submit
- password strength check
- registration finish
- create CRUD row
- trigger toast event
- emit `HX-Trigger` JSON via `/api/notify`

### `hx-put`

Use `hx-put` when updating an existing resource.

```html
<form
  hx-put="/api/items/1"
  hx-target="closest tr"
  hx-swap="outerHTML"
>
  ...
</form>
```

In this repo:

- save inline edited CRUD row
- update the theme preference

### `hx-delete`

Use `hx-delete` when deleting an existing resource.

```html
<button
  hx-delete="/api/items/1"
  hx-target="closest tr"
  hx-swap="outerHTML swap:500ms"
  hx-confirm="Delete this row?"
>
  Delete
</button>
```

In this repo:

- delete a CRUD row (with a custom confirm dialog — see Section 7).

---

## 2. Targeting And Swapping

### `hx-target`

`hx-target` tells htmx where to place the server response.

```html
hx-target="#search-results"
```

Common targets in this repo:

- `#login-result` — auth success/error.
- `#search-results` — replace live search results.
- `#modal-container` — insert modal HTML.
- `closest tr` — replace only the current table row.
- `body` — replace the whole page after logout (with a View Transition).

Use a CSS selector for fixed regions. Use relative targets like `closest tr`,
`previous .alert`, or `next li` for repeated UI such as table rows.

### `hx-swap`

`hx-swap` tells htmx how to place the response into the target.

| Swap | Meaning | Used for |
| --- | --- | --- |
| `innerHTML` | Replace the target's children. | Search results, modal container, feedback regions. |
| `outerHTML` | Replace the target element itself. | Inline row edits, tab panel, theme button. |
| `beforeend` | Append inside the target. | Adding a new table row. |
| `afterend` | Insert after the target. | Infinite scroll feed pages. |
| `afterbegin` | Insert at the start of the target. | New toast messages. |
| `none` | Do not swap response body. | Toast trigger endpoint, `/api/notify`. |
| `delete` | Remove the target. | Removing a row without a replacement. |
| `morph` | Morph the DOM (with the idiomorph extension). | See Section 9. |

Modifiers used in this repo:

```html
hx-swap="outerHTML transition:true"
hx-swap="outerHTML swap:500ms"
hx-swap="innerHTML transition:true"
```

- `transition:true` opts the swap into the View Transitions API. It only takes
  effect because `<meta name="view-transition" content="same-origin">` is set
  in `views/layout.ejs`. Remove that meta and `transition:true` becomes a no-op.
- `swap:500ms` delays the swap, useful when CSS needs time to animate an
  outgoing element. Used on row deletion to give `htmx-swapping` time to fade.
- `settle:Nms` does the same for the post-swap settling phase.
- `scroll:top`, `show:bottom` — control scroll position after the swap.

---

## 3. Triggering Requests

### Default triggers

If no `hx-trigger` is set, htmx uses the natural event:

- forms trigger on `submit`
- buttons trigger on `click`
- inputs trigger on `change`

### `hx-trigger="load"`

```html
<article
  hx-get="/api/widget/requests"
  hx-trigger="load"
  hx-swap="innerHTML"
>
  Loading...
</article>
```

Used by the lazy dashboard widgets — server-rendered skeletons that hydrate
themselves after the page is shown.

### `hx-trigger="keyup changed delay:300ms"`

Debounced input. Used by live search, username check, and password strength.
**Pair this with `hx-sync` (see Section 4) so old, in-flight requests are
cancelled when the user keeps typing.** Otherwise the server can race with
itself and the slowest response wins.

### `hx-trigger="revealed"`

Fires when the element scrolls into view. Used by the infinite activity feed.
The alternative `intersect` trigger uses the IntersectionObserver API directly
and accepts options like `intersect once threshold:0.5`.

### `hx-trigger="every 2s"`

Polling. Used by the live stats counters. The trigger is bound to the element,
so swapping the element away (the pause/resume button) cancels the timer
automatically — no `clearInterval` required. This is one of htmx's quietest
wins.

### Custom event triggers

```html
<div
  hx-get="/api/toast/latest"
  hx-trigger="showToast from:body"
  hx-swap="afterbegin"
></div>
```

The server fires the event by sending `HX-Trigger: showToast`. The listener
then GETs the next fragment. This repo uses the pattern for toasts and theme
refresh.

### Trigger modifiers

| Modifier | What it does | Example |
| --- | --- | --- |
| `delay:Nms` | Wait N ms after the last event before requesting. | Debounced inputs. |
| `throttle:Nms` | Fire at most once every N ms. | Scroll/mouse handlers. |
| `changed` | Only fire when the input value actually changed. | Avoids redundant keyup requests. |
| `once` | Fire exactly one time per element. | Setup-style triggers. |
| `from:CSS` | Listen on a different element (e.g. `from:body`, `from:closest .panel`). | Custom event chains. |
| `target:CSS` | Only fire when the event's target matches a selector. | Event delegation patterns. |
| `consume` | Stop the original DOM event from bubbling. | Forms inside cards that should swallow the click. |
| `queue:first|last|all|none` | How concurrent triggers stack. | Polling-heavy regions. |

---

## 4. `hx-sync` — coordinating concurrent requests

`hx-sync` controls what happens when a new request fires on the same element
(or selector group) before the previous one finishes.

```html
<input
  hx-get="/api/search"
  hx-trigger="keyup changed delay:300ms"
  hx-sync="this:replace"
>
```

| Strategy | Behavior |
| --- | --- |
| `drop` | Ignore the new request if one is in flight. |
| `abort` | Reject the new request, leave the old one running. |
| `replace` | Cancel the old request and run the new one. **Best default for keystroke endpoints.** |
| `queue:first` | Queue requests, only keep the first queued one. |
| `queue:last` | Queue requests, only keep the latest queued one. |
| `queue:all` | Run them all in order. |

In this repo:

- `views/partials/auth/login-form.ejs` — username check input uses
  `hx-sync="this:replace"`.
- `views/partials/search/live-search.ejs` — live search input uses
  `hx-sync="this:replace"`.

Without this, a fast typist can trigger overlapping searches, and whichever
HTTP response arrives last wins — which is often not the most recent query.

---

## 5. Including Extra Data

### Form fields

For `<form>`, htmx auto-includes all named fields.

### Query strings

For non-form GET requests, htmx serializes named inputs as query params.

### `hx-include`

Pull values from elements outside the natural form scope:

```html
<select
  id="data-filter"
  name="filter"
  hx-get="/api/data"
  hx-trigger="change"
  hx-target="#data-table"
  hx-include="#data-filter"
>
```

Used by the sortable/filterable table.

### `hx-vals`

Pass ad-hoc values, literal or lazy:

```html
<button hx-post="/api/items" hx-vals='{"source":"toolbar"}'>Add</button>
<button hx-post="/api/items" hx-vals='js:{ts: Date.now()}'>Add</button>
```

The `js:` form is evaluated each request, useful for timestamps, current
selection IDs, or any value that changes between clicks. Not used in this repo,
but a common pattern.

### `hx-params`

Filter what gets sent: `*` (default), `none`, or `not name1,name2`. Useful when
a form has internal-only inputs you don't want submitted.

---

## 6. Confirmations And Indicators

### `hx-confirm` + custom `htmx:confirm`

The default `hx-confirm` opens `window.confirm()` — synchronous and unstyled.
For a styled modal, intercept the `htmx:confirm` event:

```js
document.body.addEventListener("htmx:confirm", (event) => {
  event.preventDefault(); // stop window.confirm()
  openMyDialog(event.detail.question, () => {
    event.detail.issueRequest(true); // resume after user clicks confirm
  });
});
```

In this repo, `public/js/htmx-app.js` does exactly that. Buttons can decorate
the dialog with `data-confirm-ok`, `data-confirm-cancel`, and
`data-confirm-tone="danger"`. See `views/partials/crud/item-row.ejs`.

### `hx-prompt`

Built-in `prompt()` input. Sends the value as the `HX-Prompt` request header.

```html
<button hx-delete="/api/items/1" hx-prompt="Type the item name to confirm">
  Delete
</button>
```

Server reads `req.get("HX-Prompt")` and decides whether to honor the request.

### `hx-indicator`

Show a spinner during the request:

```html
<form hx-post="/auth/login" hx-indicator="#login-spinner">
  ...
  <span id="login-spinner" class="spinner"></span>
</form>
```

The CSS uses the `htmx-request` class htmx adds to the trigger and the
indicator. You can also use `class="htmx-indicator"` directly on an element to
fade it in via the built-in opacity rule.

---

## 7. URL And Navigation

### `hx-push-url` and `hx-replace-url`

`hx-push-url="true"` (or a path) adds the new URL to the history stack.
`hx-replace-url` does the same without adding a history entry — useful for
filter/sort UI where you don't want every click to push a back-button stop.

In this repo: tabs use `hx-push-url`. The sortable table currently does not
update the URL, but adding `hx-replace-url="/dashboard?sort=score"` would
make the current sort survive a refresh without flooding history.

### `hx-history="false"`

Excludes a page from htmx's history cache. Sensitive pages (banking, internal
tools with PII) should opt out so back-navigation can't restore stale HTML.

```html
<body hx-history="false">
```

### `HX-Redirect` and `HX-Location`

Both are response headers, not attributes.

```js
// Hard redirect — full reload
res.set("HX-Redirect", "/dashboard");

// Soft redirect — htmx fetches the target URL like a boosted navigation
res.set("HX-Location", JSON.stringify({ path: "/dashboard", target: "#main" }));
```

This repo uses `HX-Redirect` after a successful login.

### `HX-Refresh`

`res.set("HX-Refresh", "true")` forces a full-page reload. Useful when the
server determines that piecemeal swaps can't reconcile the new state (theme
schema change, schema migration, deployment marker mismatch).

---

## 8. Out-Of-Band, Reswap, Retarget, Reselect

### `hx-swap-oob`

Out-of-band swaps update something outside the request's primary target.

```html
<span id="item-count" hx-swap-oob="innerHTML">5</span>
```

In this repo: after creating, editing, or deleting a row, the response includes
`#item-count` as an OOB span. The row target updates normally; the count
updates separately. See `src/routes/api.js → sendItemWithCount`.

You can also OOB-swap into a non-existent ID by including the element with
the `hx-swap-oob` attribute — htmx will find it by ID anywhere in the document.

### `HX-Reswap` / `HX-Retarget` / `HX-Reselect`

Server-side overrides that change the swap mode, target, or selection of a
response. The triggering element no longer dictates everything.

```js
// /api/items POST in this repo, when validation fails
res
  .status(422)
  .set("HX-Retarget", "#item-form-error")
  .set("HX-Reswap", "innerHTML");
```

Why this matters: the form's natural target is `#items-body` with
`beforeend`, perfect for adding rows. But a validation error has no row to
add — appending a fake `<tr>` would be wrong. The server retargets the
response into a dedicated error region without the form having to know
about it.

`HX-Reselect` further narrows the response: tells htmx to only swap a
matching subset (`HX-Reselect: #the-bit-i-actually-want`).

### `hx-select` and `hx-select-oob`

Client-side equivalents — pick a subset of the response:

```html
<button hx-get="/full-page" hx-select="#main-content" hx-target="#region">
```

Lets you reuse a full page response for a fragment swap without the server
duplicating endpoints.

---

## 9. Server → Client Events: `HX-Trigger`

### Plain string form

```js
res.set("HX-Trigger", "showToast");
```

Fires `showToast` on `body`. Used in this repo for the toast and theme
refresh patterns.

### JSON payload form

```js
res.set("HX-Trigger", JSON.stringify({
  notify: { kind: "success", title: "Saved", message: "..." }
}));
```

Each top-level key becomes an event name. The value becomes `event.detail`.
This avoids a follow-up GET when the server already has everything the client
needs.

In this repo: `POST /api/notify` (returns 204 + JSON `HX-Trigger`) is consumed
by a `notify` listener in `public/js/htmx-app.js` that renders a toast straight
from the payload. The Advanced Patterns card on the dashboard demonstrates it.

### Timing variants

| Header | Fires |
| --- | --- |
| `HX-Trigger` | After receiving the response (default). |
| `HX-Trigger-After-Swap` | After the swap completes. |
| `HX-Trigger-After-Settle` | After the settle phase ends. |

Use the later variants when the listener depends on DOM elements the swap
just inserted.

---

## 10. Request Headers htmx Sends

Every htmx request includes a small set of headers the server can branch on:

| Header | Value |
| --- | --- |
| `HX-Request` | Always `true` for htmx requests. |
| `HX-Trigger` | The id of the triggering element. |
| `HX-Trigger-Name` | The name attribute of the triggering element. |
| `HX-Target` | The id of the target element. |
| `HX-Current-URL` | The full URL the user is on. |
| `HX-Boosted` | `true` if the request was issued by `hx-boost`. |
| `HX-Prompt` | The user's response to `hx-prompt`. |

In this repo: `src/middleware/auth.js` reads `HX-Request` to decide whether to
respond with a 401 + `HX-Redirect` (for htmx) or a 302 (for regular nav). This
is the canonical "expired session in an htmx request" pattern.

The same trick supports content negotiation:

```js
app.get("/items", (req, res) => {
  if (req.get("HX-Request")) {
    return renderFragment(req, res, "partials/items-table");
  }
  res.json(store.getItems());
});
```

Same URL, different shape, decided per request. Pair with `Vary: HX-Request`
so caches don't cross-pollute (see Section 13).

---

## 11. JS Events for Escape Hatches

When attributes aren't expressive enough, listen on `body`:

| Event | When it fires | Common use |
| --- | --- | --- |
| `htmx:configRequest` | Just before XHR send. | Inject CSRF tokens, modify headers/params. |
| `htmx:beforeRequest` | After config, before send. | Show a custom loading UI. |
| `htmx:beforeSwap` | After response, before swap. | Status-aware retarget; veto a swap. |
| `htmx:afterSwap` | After DOM is updated. | Re-init third-party widgets, focus management. |
| `htmx:afterSettle` | After the settle phase. | Stable DOM ready. |
| `htmx:responseError` | 4xx/5xx response received. | Global error toast. |
| `htmx:sendError` | Network error before any response. | Offline toast. |
| `htmx:confirm` | When `hx-confirm` is about to fire. | Replace with a custom dialog. |
| `htmx:validation:validate` | On HTML5 validation step. | Custom validation. |

In this repo, `public/js/htmx-app.js` wires:

- `htmx:configRequest` — adds the `X-CSRF-Token` header from the
  `<meta name="csrf-token">` tag.
- `htmx:confirm` — opens a styled confirm dialog instead of `window.confirm`.
- `htmx:responseError` and `htmx:sendError` — push a global toast.
- `htmx:beforeSwap` — inspects the response status and redirects 4xx/5xx
  swaps to a status-specific target (`data-target-4xx`,
  `data-target-error`). This is a 30-line equivalent of the
  response-targets extension; if you want the official one for richer
  semantics, see Section 12.

---

## 12. Extensions

htmx ships a small core. Extensions are official add-ons loaded with
`hx-ext`:

```html
<body hx-ext="response-targets, head-support">
```

| Extension | Purpose |
| --- | --- |
| `response-targets` | Per-status-code target overrides via `hx-target-4xx`, `hx-target-5xx`, `hx-target-error`. |
| `sse` | Server-Sent Events: `hx-ext="sse" sse-connect="/stream" sse-swap="message"`. Replaces polling for live data. |
| `ws` | WebSockets: `hx-ext="ws" ws-connect="/socket"`. |
| `idiomorph` | DOM morphing instead of replace. Preserves focus and form state through swaps; fixes janky outerHTML re-renders. Use `hx-swap="morph"`. |
| `head-support` | Updates `<head>` (title, meta, scripts) across swaps. Pairs well with `hx-boost`. |
| `loading-states` | Declarative loading states: `data-loading-disable`, `data-loading-class-remove`, etc. |
| `preload` | Speculative prefetch on hover/touchstart. |
| `client-side-templates` | Render JSON via Mustache/Handlebars on the client when you can't render HTML server-side. |
| `multi-swap` | One response, many independent target swaps. |
| `alpine-morph` | Idiomorph but driven by Alpine.js's morph. |
| `debug` | Logs htmx events to console. |

This repo intentionally **does not** load extensions by default — the core
attributes plus the small client script in `public/js/htmx-app.js` cover every
demo. Idiomorph and head-support are the two most likely production additions:

```html
<!-- views/layout.ejs -->
<script src="/vendor/idiomorph.min.js" defer></script>
<script src="/vendor/htmx-ext-head-support.min.js" defer></script>

<body hx-ext="head-support">
  ...
  <input hx-put="/api/preferences/theme" hx-swap="morph">
```

`hx-boost` is worth a special mention. Add it once on `<body>` and every plain
`<a>` and `<form>` becomes an htmx-driven swap of the page body. It's the
single best on-ramp for migrating an existing server-rendered site to htmx
incrementally.

---

## 13. Caching: `Vary: HX-Request`

When the server returns different shapes for the same URL based on
`HX-Request` (full page vs fragment), tell intermediaries:

```js
res.set("Vary", "HX-Request");
```

This repo registers it as a global middleware in `src/app.js`. Without it, a
CDN or reverse proxy can cache a fragment response and serve it back to a
browser that asked for the full page (or vice versa).

You can list multiple values: `Vary: HX-Request, HX-Target, Cookie`.

---

## 14. CSRF Pattern

This repo uses the canonical htmx CSRF wiring:

```ejs
<!-- views/layout.ejs -->
<meta name="csrf-token" content="<%= csrfToken %>">
```

```js
// public/js/htmx-app.js
document.body.addEventListener("htmx:configRequest", (event) => {
  const token = document.querySelector('meta[name="csrf-token"]').content;
  event.detail.headers["X-CSRF-Token"] = token;
});
```

The token is generated per session in `src/app.js`. **Production should also
verify the token on state-changing routes** — wire that up via
`csurf`, `lusca`, or your framework's CSRF middleware. The demo deliberately
keeps verification out of the hot path so the focus stays on the htmx wiring.

---

## 15. Notable Patterns In This Repo

These are patterns the showcase ships that are easy to miss without pointing
at them.

### Hidden listener as a refresh anchor

`views/dashboard.ejs`:

```html
<div
  id="theme-style-listener"
  class="sr-only"
  hx-get="/api/preferences/theme-style"
  hx-trigger="themeChanged from:body"
  hx-target="#theme-vars"
  hx-swap="outerHTML"
></div>
```

A zero-pixel element whose only job is to listen for a custom event and refresh
a different region of the page (`#theme-vars`). Useful any time one
interaction needs to publish, "this thing changed; whoever cares should
re-fetch."

### One response, many regions (OOB)

`src/routes/api.js → sendItemWithCount`:

```js
res.send(`${row}<span id="item-count" hx-swap-oob="innerHTML">${count}</span>`);
```

The primary swap places the row. The OOB span updates the count outside the
target. One HTTP response, two regions consistent — without re-rendering the
whole table.

### htmx-aware auth guard

`src/middleware/auth.js`:

```js
if (req.get("HX-Request")) {
  res.set("HX-Redirect", "/login").status(401).send("");
} else {
  res.redirect("/login");
}
```

Same auth check, two response shapes. Production htmx apps trip on this
constantly — htmx requests need `HX-Redirect` or they'll try to swap a 302's
empty body.

### Polling lifecycle by element replacement

`views/partials/dashboard/polling-panel.ejs`. The pause button swaps the
entire `#polling-panel`. The element with `hx-trigger="every 2s"` no longer
exists, so the timer is gone. No `clearInterval`, no client state.

### Form-error retarget on validation failure

`src/routes/api.js → POST /api/items`:

```js
res
  .status(422)
  .set("HX-Retarget", "#item-form-error")
  .set("HX-Reswap", "innerHTML");
```

The form's natural target is `#items-body` (for new rows). The server
overrides target and swap when the response is an error, so the alert lands
in the dedicated error region instead of pretending to be a row.

---

## 16. Feature Mapping In This Repo

| Feature | Main files | Main htmx syntax |
| --- | --- | --- |
| Login | `views/partials/auth/login-form.ejs`, `src/routes/auth.js` | `hx-post`, `hx-target`, `hx-indicator`, `HX-Redirect` |
| Username check | `views/partials/auth/login-form.ejs`, `views/partials/auth/username-status.ejs` | `hx-get`, debounced `hx-trigger`, `hx-sync="this:replace"` |
| Password strength | `views/partials/auth/login-form.ejs`, `views/partials/auth/password-strength.ejs` | `hx-post`, debounced `hx-trigger` |
| Registration wizard | `views/partials/auth/register-step-*.ejs` | `hx-get`, `hx-target`, `hx-swap` |
| Lazy widgets | `views/partials/dashboard/widgets.ejs` | `hx-trigger="load"`, staggered `delay:` |
| Infinite feed | `views/partials/feed/infinite-scroll.ejs` | `hx-trigger="revealed"`, `hx-swap="afterend"` |
| Live search | `views/partials/search/live-search.ejs` | `hx-get`, debounced trigger, `hx-sync="this:replace"` |
| CRUD | `views/partials/crud/*.ejs`, `src/routes/api.js` | `hx-post`, `hx-put`, `hx-delete`, `hx-confirm`, `hx-swap-oob`, `HX-Retarget`/`HX-Reswap` |
| Tabs | `views/partials/dashboard/tabs.ejs` | `hx-get`, `hx-target`, `hx-swap`, `hx-push-url` |
| Polling | `views/partials/dashboard/polling.ejs` | `hx-trigger="every 2s"` |
| Modal | `views/partials/modal/*.ejs` | `hx-get`, `hx-target`, `hx-swap` |
| Toast | `views/partials/toast/toast.ejs`, `public/js/htmx-app.js` | `hx-post`, `hx-swap="none"`, `HX-Trigger` (string + JSON forms) |
| Theme | `views/partials/dashboard/theme-toggle.ejs`, `views/dashboard.ejs` | `hx-put`, `HX-Trigger`, `themeChanged from:body` |
| Sort/filter table | `views/partials/data/*.ejs` | `hx-get`, `hx-include`, query params, `hx-trigger="change"` |
| Advanced patterns | `views/partials/dashboard/advanced.ejs`, `public/js/htmx-app.js` | `HX-Trigger` JSON payload, `data-target-4xx`, `htmx:confirm`, `htmx:responseError` |

---

## 17. When To Use htmx Instead Of A JS Framework

htmx is a strong fit when:

- the server can render HTML naturally
- interactions are mostly forms, tables, filters, tabs, modals, search,
  pagination, polling, or CRUD
- SEO and first paint matter
- you want less client-side state management
- the same backend validation should drive both data and UI feedback
- you want progressive enhancement around normal HTML
- you want a small payload (~14 KB gzipped, no build step)

Examples:

- admin panels
- internal tools
- dashboards
- CRUD apps
- documentation portals
- e-commerce account/order screens
- search and filter pages
- settings pages

## 18. When A JS Framework Is Usually Better

React, Vue, Svelte, or similar are usually better when:

- the UI has complex client-only state
- many components update from local state without server round trips
- you need rich canvas/WebGL interactions
- the app is offline-first
- drag-and-drop state is deeply interactive
- optimistic updates and client caches are central to the experience
- the frontend is shared across web, mobile shells, or a large design system

Examples:

- Figma-style editors
- Notion-style collaborative editing surfaces
- rich spreadsheet/grid apps
- complex map editors
- games
- offline-first PWAs

## 19. They Compose

htmx is happy to share a page with:

- **Alpine.js** — tiny declarative state for menus, dropdowns, popovers,
  client-only toggles. Many real htmx apps use Alpine for the local UI bits
  that don't need a server round trip.
- **Hyperscript** — htmx's sibling project. Inline behavior (`_="on click
  toggle .open"`) without writing `<script>`.
- **Web Components** — encapsulate non-htmx UI (charts, editors) and let htmx
  drive the surrounding shell.
- **Vanilla `fetch()`** — for things that genuinely need imperative JS, drop
  it in. htmx doesn't take over the page.

## 20. Practical Rule

Use htmx when the server already knows the next correct HTML.

Use a JS framework when the browser needs to own a lot of temporary UI state
before the server is involved.

They can also be mixed, but this repo intentionally avoids that so the htmx
model is easy to study.
