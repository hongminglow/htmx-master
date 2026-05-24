/*
 * htmx Unleashed - small client-side glue.
 *
 * This file is intentionally short. Everything here is an "escape hatch"
 * for behavior that's awkward to express with attributes alone:
 *
 *   1. CSRF: forward the per-session token on every htmx request.
 *   2. Custom confirm dialog: replace window.confirm() with a styled modal.
 *   3. Global error toast: surface htmx:responseError / htmx:sendError.
 *   4. HX-Trigger JSON payload: render a toast directly from the event detail.
 *   5. Status-aware retargeting: a tiny response-targets-style helper that
 *      reads data-target-error on the triggering element when the response
 *      status is 4xx or 5xx, without pulling in the official extension.
 *
 * Everything else in the app remains attribute-driven.
 */
(function () {
  "use strict";

  if (typeof window === "undefined" || !document.body) {
    document.addEventListener("DOMContentLoaded", install);
    return;
  }

  install();

  function install() {
    wireCsrf();
    wireCustomConfirm();
    wireGlobalErrorToast();
    wireNotifyEvent();
    wireStatusRetarget();
  }

  /* ------------------------------------------------------------------ */
  /* CSRF                                                                */
  /* ------------------------------------------------------------------ */

  function wireCsrf() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (!meta) return;
    const token = meta.getAttribute("content");
    if (!token) return;

    document.body.addEventListener("htmx:configRequest", function (event) {
      // Add the token to every htmx-issued request. The server can validate
      // it on POST/PUT/DELETE/PATCH. Same-origin only — htmx never sends
      // headers cross-origin unless explicitly told to.
      event.detail.headers["X-CSRF-Token"] = token;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Custom confirm dialog                                               */
  /* ------------------------------------------------------------------ */

  function wireCustomConfirm() {
    document.body.addEventListener("htmx:confirm", function (event) {
      const trigger = event.detail.elt;
      const message = event.detail.question || trigger.getAttribute("hx-confirm");
      if (!message) return;

      // Stop htmx from showing window.confirm(). We'll resume the original
      // request via event.detail.issueRequest() after the user decides.
      event.preventDefault();

      openConfirmDialog({
        message: message,
        confirmLabel: trigger.getAttribute("data-confirm-ok") || "Confirm",
        cancelLabel: trigger.getAttribute("data-confirm-cancel") || "Cancel",
        tone: trigger.getAttribute("data-confirm-tone") || "danger",
        onConfirm: function () {
          event.detail.issueRequest(true);
        }
      });
    });
  }

  function openConfirmDialog(options) {
    const backdrop = document.createElement("div");
    backdrop.className = "confirm-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.innerHTML =
      '<section class="confirm-dialog">' +
      '  <p class="confirm-message"></p>' +
      '  <div class="confirm-actions">' +
      '    <button type="button" class="button button-ghost" data-action="cancel"></button>' +
      '    <button type="button" class="button" data-action="ok"></button>' +
      "  </div>" +
      "</section>";

    backdrop.querySelector(".confirm-message").textContent = options.message;
    const cancelBtn = backdrop.querySelector('[data-action="cancel"]');
    const okBtn = backdrop.querySelector('[data-action="ok"]');
    cancelBtn.textContent = options.cancelLabel;
    okBtn.textContent = options.confirmLabel;
    okBtn.classList.add(options.tone === "danger" ? "button-danger" : "button-primary");

    const close = function () {
      backdrop.removeEventListener("keydown", onKey);
      backdrop.remove();
    };
    const onKey = function (event) {
      if (event.key === "Escape") close();
      if (event.key === "Enter") {
        close();
        options.onConfirm();
      }
    };
    cancelBtn.addEventListener("click", close);
    okBtn.addEventListener("click", function () {
      close();
      options.onConfirm();
    });
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) close();
    });
    backdrop.addEventListener("keydown", onKey);

    document.body.appendChild(backdrop);
    okBtn.focus();
  }

  /* ------------------------------------------------------------------ */
  /* Global response error toast                                         */
  /* ------------------------------------------------------------------ */

  function wireGlobalErrorToast() {
    document.body.addEventListener("htmx:responseError", function (event) {
      const xhr = event.detail.xhr;
      const path = (event.detail.requestConfig && event.detail.requestConfig.path) || "request";
      pushToast({
        kind: "warning",
        title: xhr.status + " on " + path,
        message: xhr.statusText || "Server returned an error response."
      });
    });

    document.body.addEventListener("htmx:sendError", function () {
      pushToast({
        kind: "warning",
        title: "Network error",
        message: "Could not reach the server. Check your connection and try again."
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* HX-Trigger JSON payload listener                                    */
  /* ------------------------------------------------------------------ */

  function wireNotifyEvent() {
    // Server can publish: HX-Trigger: {"notify": {"kind":"...","title":"...","message":"..."}}
    // No follow-up GET needed — the toast is rendered straight from the payload.
    document.body.addEventListener("notify", function (event) {
      const payload = event.detail || {};
      pushToast({
        kind: payload.kind || "success",
        title: payload.title || "Notification",
        message: payload.message || ""
      });
    });
  }

  function pushToast(toast) {
    const list = document.getElementById("toast-list");
    if (!list) return;

    const article = document.createElement("article");
    article.className = "toast toast-" + (toast.kind || "success");
    const strong = document.createElement("strong");
    strong.textContent = toast.title || "";
    const span = document.createElement("span");
    span.textContent = toast.message || "";
    article.appendChild(strong);
    article.appendChild(span);
    list.insertBefore(article, list.firstChild);
  }

  /* ------------------------------------------------------------------ */
  /* Status-aware retargeting (mini response-targets)                    */
  /* ------------------------------------------------------------------ */

  function wireStatusRetarget() {
    document.body.addEventListener("htmx:beforeSwap", function (event) {
      const xhr = event.detail.xhr;
      if (!xhr || xhr.status < 400) return;

      const trigger = event.detail.requestConfig && event.detail.requestConfig.elt;
      if (!trigger) return;

      // data-target-4xx / data-target-5xx / data-target-error redirect the
      // swap to a status-specific region. This mirrors the official
      // response-targets extension at a fraction of the size.
      const status = String(xhr.status);
      const specific = trigger.getAttribute("data-target-" + status);
      const range = trigger.getAttribute("data-target-" + status[0] + "xx");
      const generic = trigger.getAttribute("data-target-error");
      const selector = specific || range || generic;
      if (!selector) return;

      const target = document.querySelector(selector);
      if (!target) return;

      event.detail.shouldSwap = true;
      event.detail.target = target;
    });
  }
})();
