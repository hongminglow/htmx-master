function themeCss(theme) {
  if (theme === "light") {
    return `:root {
  color-scheme: light;
  --bg: #f6f8fb;
  --surface: #ffffff;
  --surface-2: #eef2f7;
  --surface-3: #e2e8f0;
  --text: #0f172a;
  --muted: #475569;
  --faint: #64748b;
  --border: rgba(15, 23, 42, 0.14);
  --strong-border: rgba(15, 23, 42, 0.24);
  --accent: #15803d;
  --accent-strong: #166534;
  --accent-soft: rgba(34, 197, 94, 0.14);
  --cyan: #0369a1;
  --violet: #6d28d9;
  --amber: #b45309;
  --danger: #b91c1c;
  --shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
}`;
  }

  return `:root {
  color-scheme: dark;
  --bg: #070a12;
  --surface: #0d1320;
  --surface-2: #121a2a;
  --surface-3: #172133;
  --text: #f8fafc;
  --muted: #aeb9ca;
  --faint: #738196;
  --border: rgba(148, 163, 184, 0.18);
  --strong-border: rgba(148, 163, 184, 0.34);
  --accent: #22c55e;
  --accent-strong: #86efac;
  --accent-soft: rgba(34, 197, 94, 0.16);
  --cyan: #22d3ee;
  --violet: #a78bfa;
  --amber: #f59e0b;
  --danger: #fb7185;
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
}`;
}

module.exports = { themeCss };
