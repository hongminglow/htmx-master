function themeCss(theme) {
  if (theme === "light") {
    return `:root {
  color-scheme: light;
  --bg: #f7f8fa;
  --surface: #ffffff;
  --surface-2: #f1f3f7;
  --surface-3: #e6e9ef;
  --text: #0f172a;
  --muted: #4b5563;
  --faint: #6b7280;
  --border: rgba(15, 23, 42, 0.08);
  --strong-border: rgba(15, 23, 42, 0.16);
  --accent: #16a34a;
  --accent-strong: #15803d;
  --accent-soft: rgba(22, 163, 74, 0.10);
  --cyan: #0284c7;
  --violet: #7c3aed;
  --amber: #b45309;
  --danger: #b91c1c;
  --danger-soft: rgba(185, 28, 28, 0.08);
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 6px 16px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 18px 48px rgba(15, 23, 42, 0.10), 0 4px 12px rgba(15, 23, 42, 0.05);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
}`;
  }

  return `:root {
  color-scheme: dark;
  --bg: #0a0e17;
  --surface: #11151f;
  --surface-2: #161b27;
  --surface-3: #1d2330;
  --text: #e8ecf3;
  --muted: #9aa4b6;
  --faint: #6b7384;
  --border: rgba(148, 163, 184, 0.10);
  --strong-border: rgba(148, 163, 184, 0.20);
  --accent: #4ade80;
  --accent-strong: #86efac;
  --accent-soft: rgba(74, 222, 128, 0.12);
  --cyan: #22d3ee;
  --violet: #a78bfa;
  --amber: #fbbf24;
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.10);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 6px 16px rgba(0, 0, 0, 0.32), 0 2px 4px rgba(0, 0, 0, 0.20);
  --shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.42), 0 4px 12px rgba(0, 0, 0, 0.28);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
}`;
}

module.exports = { themeCss };
