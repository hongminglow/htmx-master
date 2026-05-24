/*
 * Inline SVG icon set. Single-stroke, currentColor — sized via the size arg.
 * Source: hand-trimmed Lucide / Feather geometry, normalized to 24x24 with
 * 1.75 stroke weight so they sit well next to Inter at 0.85-0.95rem.
 */

const ICONS = {
  grid:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/>' +
    '<rect x="14" y="3" width="7" height="7" rx="1.5"/>' +
    '<rect x="3" y="14" width="7" height="7" rx="1.5"/>' +
    '<rect x="14" y="14" width="7" height="7" rx="1.5"/>',

  activity:
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',

  search:
    '<circle cx="11" cy="11" r="7"/>' +
    '<line x1="20" y1="20" x2="16.65" y2="16.65"/>',

  table:
    '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
    '<line x1="3" y1="10" x2="21" y2="10"/>' +
    '<line x1="9" y1="4" x2="9" y2="20"/>',

  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/>' +
    '<polyline points="2 17 12 22 22 17"/>' +
    '<polyline points="2 12 12 17 22 12"/>',

  refresh:
    '<polyline points="23 4 23 10 17 10"/>' +
    '<polyline points="1 20 1 14 7 14"/>' +
    '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>' +
    '<path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>',

  window:
    '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
    '<line x1="3" y1="9" x2="21" y2="9"/>' +
    '<circle cx="6.5" cy="6.5" r="0.6" fill="currentColor"/>' +
    '<circle cx="9.5" cy="6.5" r="0.6" fill="currentColor"/>',

  bell:
    '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
    '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>',

  bars:
    '<line x1="4" y1="20" x2="4" y2="10"/>' +
    '<line x1="10" y1="20" x2="10" y2="4"/>' +
    '<line x1="16" y1="20" x2="16" y2="14"/>' +
    '<line x1="22" y1="20" x2="2" y2="20"/>',

  zap:
    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',

  sun:
    '<circle cx="12" cy="12" r="4"/>' +
    '<line x1="12" y1="2" x2="12" y2="4"/>' +
    '<line x1="12" y1="20" x2="12" y2="22"/>' +
    '<line x1="2" y1="12" x2="4" y2="12"/>' +
    '<line x1="20" y1="12" x2="22" y2="12"/>' +
    '<line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>' +
    '<line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>' +
    '<line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>' +
    '<line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>',

  moon:
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',

  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
    '<polyline points="16 17 21 12 16 7"/>' +
    '<line x1="21" y1="12" x2="9" y2="12"/>',

  plus:
    '<line x1="12" y1="5" x2="12" y2="19"/>' +
    '<line x1="5" y1="12" x2="19" y2="12"/>',

  pencil:
    '<path d="M12 20h9"/>' +
    '<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',

  trash:
    '<polyline points="3 6 5 6 21 6"/>' +
    '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
    '<path d="M10 11v6"/>' +
    '<path d="M14 11v6"/>' +
    '<path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',

  check:
    '<polyline points="20 6 9 17 4 12"/>',

  alert:
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="12" y1="8" x2="12" y2="12"/>' +
    '<line x1="12" y1="16" x2="12.01" y2="16"/>',

  pulse:
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',

  chevron:
    '<polyline points="9 18 15 12 9 6"/>',

  arrowUp:
    '<line x1="12" y1="19" x2="12" y2="5"/>' +
    '<polyline points="5 12 12 5 19 12"/>',

  arrowDown:
    '<line x1="12" y1="5" x2="12" y2="19"/>' +
    '<polyline points="19 12 12 19 5 12"/>',

  sparkles:
    '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>' +
    '<path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z"/>',

  send:
    '<line x1="22" y1="2" x2="11" y2="13"/>' +
    '<polygon points="22 2 15 22 11 13 2 9 22 2"/>',

  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',

  command:
    '<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>'
};

function icon(name, options) {
  const opts = options || {};
  const body = ICONS[name];
  if (!body) return "";
  const size = opts.size || 18;
  const stroke = opts.stroke || 1.75;
  const cls = opts.className ? ` class="${opts.className}"` : "";
  return (
    `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="${stroke}" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `${body}</svg>`
  );
}

module.exports = { icon, ICONS };
