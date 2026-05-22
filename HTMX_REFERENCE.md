# htmx Attribute Reference For This Repo

This file maps the htmx syntax used in `htmx Unleashed` to the features it powers.

The short version: htmx lets ordinary HTML elements make HTTP requests and swap returned HTML into the page.

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

No React state, no client-side router, no JSON parsing, and no custom `fetch()` handler are needed for that interaction.

## Request Attributes

### `hx-get`

Use `hx-get` when the interaction reads data or loads UI without changing server state.

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

Use `hx-post` when submitting data that creates something, validates something, or performs an action.

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

Think of it as: "submit this form/action to a POST endpoint and swap the returned HTML."

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

Think of it as: "update this existing thing and replace the affected UI."

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

- delete a CRUD row

Think of it as: "call a DELETE endpoint and remove or replace the target HTML."

## Targeting And Swapping

### `hx-target`

`hx-target` tells htmx where to place the server response.

```html
hx-target="#search-results"
```

Common targets in this repo:

- `#login-result`: show auth success/error
- `#search-results`: replace live search results
- `#modal-container`: insert modal HTML
- `closest tr`: replace only the current table row
- `body`: replace the whole page after logout

Use a CSS selector when targeting a fixed region. Use relative targets like `closest tr` for repeated UI such as table rows.

### `hx-swap`

`hx-swap` tells htmx how to place the response into the target.

```html
hx-swap="innerHTML"
```

Swap modes used here:

| Swap | Meaning | Used for |
| --- | --- | --- |
| `innerHTML` | Replace the target's children. | Search results, modal container, feedback regions. |
| `outerHTML` | Replace the target element itself. | Inline row edits, tab panel, theme button. |
| `beforeend` | Append inside the target. | Adding a new table row. |
| `afterend` | Insert after the target. | Infinite scroll feed pages. |
| `afterbegin` | Insert at the start of the target. | New toast messages. |
| `none` | Do not swap response body. | Toast trigger endpoint that only sends an event header. |

Modifiers used here:

```html
hx-swap="outerHTML transition:true"
hx-swap="outerHTML swap:500ms"
```

- `transition:true` opts that swap into the View Transitions API.
- `swap:500ms` delays the swap, useful when CSS needs time to animate an outgoing element.

## Triggering Requests

### Default triggers

If no `hx-trigger` is set, htmx uses the natural event:

- forms submit on `submit`
- buttons trigger on `click`
- inputs usually trigger based on their explicit trigger

Example:

```html
<button hx-get="/api/modal/details" hx-target="#modal-container">
  Open modal
</button>
```

The button sends the request on click.

### `hx-trigger="load"`

Use this to request content immediately when the element loads.

```html
<article
  hx-get="/api/widget/requests"
  hx-trigger="load"
  hx-swap="innerHTML"
>
  Loading...
</article>
```

In this repo:

- lazy dashboard widgets

Use this for server-rendered skeletons that hydrate themselves after initial page load.

### `hx-trigger="keyup changed delay:300ms"`

Use this for debounced input interactions.

```html
<input
  hx-get="/api/search"
  hx-trigger="keyup changed delay:300ms"
  hx-target="#search-results"
>
```

In this repo:

- live search
- username check
- password strength check

Use this when you want the server to react after typing pauses.

### `hx-trigger="revealed"`

Use this when an element should request content after it scrolls into view.

```html
<div
  hx-get="/api/feed?page=2"
  hx-trigger="revealed"
  hx-swap="afterend"
></div>
```

In this repo:

- infinite activity feed

Use this for simple infinite scroll or progressive loading.

### `hx-trigger="every 2s"`

Use this for polling.

```html
<div
  hx-get="/api/stats"
  hx-trigger="every 2s"
  hx-swap="innerHTML"
></div>
```

In this repo:

- live stats counters

Use this when occasional polling is good enough and you do not need WebSockets.

### Custom event triggers

htmx can listen for custom browser events.

```html
<div
  hx-get="/api/toast/latest"
  hx-trigger="showToast from:body"
  hx-swap="afterbegin"
></div>
```

The server sends:

```http
HX-Trigger: showToast
```

Then the listener fetches the latest toast.

In this repo:

- toast notifications
- theme style refresh

Use this when one server response should cause a second part of the page to update.

## Including Extra Data

### Form fields

For forms, htmx sends form fields automatically.

```html
<form hx-post="/api/items" hx-target="#items-body" hx-swap="beforeend">
  <input name="name">
  <input name="owner">
</form>
```

Express receives:

```js
req.body.name
req.body.owner
```

### Query strings

For GET requests, htmx sends named inputs as query params.

```html
<input name="q" hx-get="/api/search">
```

Express receives:

```js
req.query.q
```

### `hx-include`

Use `hx-include` when the triggering element needs to include another input's value.

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

In this repo:

- sortable and filterable table

Use this when your button/header/select is not inside a form but still needs extra request parameters.

## Confirmations And Indicators

### `hx-confirm`

Use this for a built-in confirmation prompt before a risky request.

```html
<button
  hx-delete="/api/items/1"
  hx-confirm="Delete this row?"
>
  Delete
</button>
```

In this repo:

- delete row confirmation

### `hx-indicator`

Use this to show request activity.

```html
<form hx-post="/auth/login" hx-indicator="#login-spinner">
  ...
</form>
```

In this repo:

- login spinner
- widget spinners
- search spinner
- feed spinner

The CSS uses htmx's request state classes to reveal indicators.

## URL And Navigation

### `hx-push-url`

Use this when a fragment interaction should also update browser history.

```html
<button
  hx-get="/api/tabs/forms"
  hx-target="#tab-demo"
  hx-swap="outerHTML"
  hx-push-url="/dashboard?tab=forms"
>
  Forms
</button>
```

In this repo:

- tabs

Use this when the user should be able to bookmark or navigate back to a UI state.

### `HX-Redirect`

`HX-Redirect` is a response header, not an HTML attribute.

```js
res.set("HX-Redirect", "/dashboard");
```

In this repo:

- successful login redirects to `/dashboard`
- expired htmx requests can redirect back to `/login`

Use this when the server decides the browser should navigate to another full page.

## Out-Of-Band Updates

### `hx-swap-oob`

Out-of-band swaps let one response update something outside the normal target.

```html
<span id="item-count" hx-swap-oob="innerHTML">5</span>
```

In this repo:

- after adding, editing, or deleting a row, the row target updates normally and `#item-count` also updates

Use this when one action affects multiple UI regions.

Example:

```js
res.send(`
  <tr>...</tr>
  <span id="item-count" hx-swap-oob="innerHTML">5</span>
`);
```

## Feature Mapping In This Repo

| Feature | Main files | Main htmx syntax |
| --- | --- | --- |
| Login | `views/partials/auth/login-form.ejs`, `src/routes/auth.js` | `hx-post`, `hx-target`, `hx-indicator`, `HX-Redirect` |
| Username check | `views/partials/auth/login-form.ejs`, `views/partials/auth/username-status.ejs` | `hx-get`, `hx-trigger="keyup changed delay:500ms"` |
| Password strength | `views/partials/auth/login-form.ejs`, `views/partials/auth/password-strength.ejs` | `hx-post`, `hx-trigger="keyup changed delay:300ms"` |
| Registration wizard | `views/partials/auth/register-step-*.ejs` | `hx-get`, `hx-target`, `hx-swap` |
| Lazy widgets | `views/partials/dashboard/widgets.ejs`, `views/partials/dashboard/widget-content.ejs` | `hx-get`, `hx-trigger="load"`, `hx-indicator` |
| Infinite feed | `views/partials/feed/infinite-scroll.ejs`, `views/partials/feed/feed-page.ejs` | `hx-trigger="revealed"`, `hx-swap="afterend"` |
| Live search | `views/partials/search/live-search.ejs`, `views/partials/search/search-results.ejs` | `hx-get`, `keyup changed delay`, `hx-target` |
| CRUD | `views/partials/crud/crud-table.ejs`, `views/partials/crud/item-row.ejs`, `views/partials/crud/item-edit-row.ejs` | `hx-post`, `hx-put`, `hx-delete`, `hx-confirm`, `hx-swap-oob` |
| Tabs | `views/partials/dashboard/tabs.ejs` | `hx-get`, `hx-target`, `hx-swap`, `hx-push-url` |
| Polling | `views/partials/dashboard/polling.ejs`, `views/partials/dashboard/polling-panel.ejs` | `hx-trigger="every 2s"` |
| Modal | `views/partials/modal/modal.ejs`, `views/partials/modal/modal-dialog.ejs` | `hx-get`, `hx-target`, `hx-swap` |
| Toast | `views/partials/toast/toast.ejs`, `views/partials/toast/toast-item.ejs` | `hx-post`, `hx-swap="none"`, `HX-Trigger`, custom event trigger |
| Theme | `views/partials/dashboard/theme-toggle.ejs`, `views/dashboard.ejs` | `hx-put`, `HX-Trigger`, `hx-trigger="themeChanged from:body"` |
| Sort/filter table | `views/partials/data/sortable-table.ejs`, `views/partials/data/sortable-data-table.ejs` | `hx-get`, `hx-include`, query params, `hx-trigger="change"` |

## When To Use htmx Instead Of A JS Framework

htmx is a strong fit when:

- the server can render HTML naturally
- interactions are mostly forms, tables, filters, tabs, modals, search, pagination, polling, or CRUD
- SEO and first paint matter
- you want less client-side state management
- your team wants to avoid a frontend build pipeline for a mostly server-rendered app
- the same backend validation should drive both data and UI feedback
- you want progressive enhancement around normal HTML

Examples:

- admin panels
- internal tools
- dashboards
- CRUD apps
- documentation portals
- e-commerce account/order screens
- search and filter pages
- settings pages

## When A JS Framework Is Usually Better

React, Vue, Svelte, or similar frameworks are usually better when:

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

## Practical Rule

Use htmx when the server already knows the next correct HTML.

Use a JS framework when the browser needs to own a lot of temporary UI state before the server is involved.

They can also be mixed, but this repo intentionally avoids that so the htmx model is easy to study.
