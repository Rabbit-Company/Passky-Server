export const adminStyles = String.raw`
:root {
  color-scheme: dark;
  --bg: #080d19;
  --panel: #111827;
  --panel-strong: #182235;
  --border: #26344d;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --accent: #3f66ff;
  --accent-hover: #709cff;
  --accent-deep: #2340ff;
  --accent-emphasis: #709cff;
  --accent-soft: rgba(63, 102, 255, .16);
  --accent-glow: rgba(35, 64, 255, .10);
  --accent-gradient: linear-gradient(135deg, #709cff 0%, #3f66ff 48%, #2340ff 100%);
  --success: #34d399;
  --warning: #fbbf24;
  --danger: #fb7185;
  --shadow: 0 18px 45px rgba(0, 0, 0, .22);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f1f5f9;
  --panel: #ffffff;
  --panel-strong: #f8fafc;
  --border: #d8e0ec;
  --text: #172033;
  --muted: #64748b;
  --accent: #2441ff;
  --accent-hover: #3f66ff;
  --accent-deep: #1c36ff;
  --accent-emphasis: #2441ff;
  --accent-soft: rgba(36, 65, 255, .09);
  --accent-glow: rgba(112, 156, 255, .12);
  --accent-gradient: linear-gradient(135deg, #709cff 0%, #3f66ff 48%, #2340ff 100%);
  --success: #047857;
  --warning: #b45309;
  --danger: #be123c;
  --shadow: 0 18px 45px rgba(30, 41, 59, .10);
}

* {
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-soft) transparent;
}
*::-webkit-scrollbar { width: .7rem; height: .7rem; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { min-height: 2.5rem; border: 2px solid transparent; border-radius: 999px; background: var(--accent-soft); background-clip: padding-box; }
*::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--accent) 28%, transparent); background-clip: padding-box; }
*::-webkit-scrollbar-corner { background: transparent; }
html { min-height: 100%; overflow-y: scroll; scrollbar-gutter: stable; background: var(--bg); }
body { min-height: 100vh; margin: 0; background: radial-gradient(circle at top left, var(--accent-soft), transparent 28rem), radial-gradient(circle at 85% 0, var(--accent-glow), transparent 24rem), var(--bg); color: var(--text); }
button, input, select, textarea { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
a { color: inherit; }

.layout { min-height: 100vh; display: grid; grid-template-columns: 16rem minmax(0, 1fr); }
.sidebar { position: sticky; top: 0; height: 100vh; padding: 1.4rem 1rem; border-right: 1px solid var(--border); background: color-mix(in srgb, var(--panel) 92%, transparent); backdrop-filter: blur(18px); }
.brand { display: flex; align-items: center; gap: .8rem; padding: .35rem .55rem 1.5rem; }
.brand-logo { width: 2.5rem; height: 2.5rem; display: block; object-fit: contain; filter: drop-shadow(0 8px 14px rgba(62, 88, 255, .3)); }
.brand strong { display: block; letter-spacing: -.02em; }
.brand small { color: var(--muted); }
.nav { display: grid; gap: .35rem; }
.nav a { padding: .72rem .8rem; border-radius: .65rem; color: var(--muted); text-decoration: none; font-weight: 650; }
.nav a:hover { color: var(--text); background: var(--panel-strong); }
.nav a[aria-current="page"] { color: var(--text); background: var(--accent-soft); box-shadow: inset 3px 0 var(--accent); }
.sidebar-footer { position: absolute; inset: auto 1rem 1.4rem; display: grid; gap: .75rem; }

.main { min-width: 0; padding: 2rem clamp(1rem, 3vw, 3rem) 4rem; }
.topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.8rem; }
.eyebrow { color: var(--accent-emphasis); text-transform: uppercase; letter-spacing: .12em; font-size: .72rem; font-weight: 800; }
h1 { margin: .3rem 0 0; font-size: clamp(1.7rem, 3vw, 2.35rem); letter-spacing: -.04em; }
h2 { margin: 0; font-size: 1.05rem; }
p { line-height: 1.6; }
.muted { color: var(--muted); }

.button { min-height: 2.55rem; display: inline-flex; align-items: center; justify-content: center; gap: .45rem; padding: .58rem .9rem; border: 1px solid var(--border); border-radius: .58rem; background: var(--panel-strong); color: var(--text); text-decoration: none; font-weight: 700; cursor: pointer; }
.button:hover { border-color: var(--accent); }
.button.primary { border-color: transparent; background: var(--accent-gradient); color: white; box-shadow: 0 7px 20px color-mix(in srgb, var(--accent-deep) 24%, transparent); }
.button.primary:hover { border-color: transparent; filter: brightness(1.08); }
.button.danger { border-color: color-mix(in srgb, var(--danger) 45%, var(--border)); color: var(--danger); }
.button.quiet { min-height: auto; padding: .4rem .6rem; background: transparent; }
.button.icon { width: 2.35rem; min-height: 2.35rem; padding: 0; }

.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.35rem; }
.stat { padding: 1.15rem; border: 1px solid var(--border); border-radius: .85rem; background: linear-gradient(145deg, var(--panel), var(--panel-strong)); box-shadow: var(--shadow); }
.stat span { display: block; color: var(--muted); font-size: .8rem; font-weight: 650; }
.stat strong { display: block; margin-top: .45rem; font-size: 1.65rem; letter-spacing: -.04em; }
.stat:is(a) { color: inherit; text-decoration: none; }
.stat:is(a):hover { border-color: var(--accent); transform: translateY(-1px); }

.panel { border: 1px solid var(--border); border-radius: .9rem; background: var(--panel); box-shadow: var(--shadow); overflow: hidden; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.15rem; border-bottom: 1px solid var(--border); }
.panel-body { padding: 1.15rem; }
.actions, .filters { display: flex; align-items: end; flex-wrap: wrap; gap: .65rem; }
.filters { margin-bottom: 1rem; }
.field { display: grid; gap: .35rem; color: var(--muted); font-size: .78rem; font-weight: 700; }
input, select, textarea { width: 100%; min-height: 2.55rem; padding: .58rem .7rem; border: 1px solid var(--border); border-radius: .55rem; outline: none; background: var(--panel-strong); color: var(--text); }
input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
textarea { min-height: 14rem; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; line-height: 1.55; }
.search { min-width: min(22rem, 100%); flex: 1; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: .82rem 1rem; text-align: left; border-bottom: 1px solid var(--border); vertical-align: middle; }
th { color: var(--muted); background: var(--panel-strong); font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--accent-soft); }
.cell-title { max-width: 24rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 750; }
.cell-subtitle { max-width: 24rem; margin-top: .2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: .82rem; }
.row-actions { display: flex; justify-content: flex-end; gap: .35rem; }
.badge { display: inline-flex; align-items: center; padding: .25rem .5rem; border-radius: 999px; background: var(--panel-strong); color: var(--muted); font-size: .72rem; font-weight: 750; }
.badge.success { background: color-mix(in srgb, var(--success) 13%, transparent); color: var(--success); }
.empty { padding: 3.5rem 1rem; text-align: center; color: var(--muted); }

.pagination { min-height: 4rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: .85rem; }
.page-links { display: flex; gap: .35rem; }
.page-links a, .page-links span { min-width: 2.25rem; height: 2.25rem; display: grid; place-items: center; border: 1px solid var(--border); border-radius: .5rem; text-decoration: none; }
.page-links span { border-color: transparent; background: var(--accent-gradient); color: white; box-shadow: 0 5px 14px color-mix(in srgb, var(--accent-deep) 22%, transparent); }

.notice { margin-bottom: 1rem; padding: .8rem 1rem; border: 1px solid var(--border); border-left: 4px solid var(--success); border-radius: .6rem; background: var(--panel); }
.notice.warning { border-left-color: var(--warning); }
.connection-guide { margin-top: 1rem; }
.guide-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.guide-step { display: grid; grid-template-columns: 2.2rem minmax(0, 1fr); align-items: start; gap: .8rem; }
.guide-step > span { width: 2.2rem; height: 2.2rem; display: grid; place-items: center; border-radius: 50%; background: var(--accent-gradient); color: white; font-weight: 800; box-shadow: 0 6px 16px color-mix(in srgb, var(--accent-deep) 24%, transparent); }
.guide-step p { margin: .35rem 0 0; }
.guide-step a { color: var(--accent-emphasis); }
.copy-field { display: flex; gap: .45rem; margin-top: .75rem; }
.copy-field input { min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.health-list { display: grid; }
.health-item { display: grid; grid-template-columns: 1rem minmax(0, 1fr); gap: .85rem; padding: 1rem 1.15rem; border-bottom: 1px solid var(--border); }
.health-item:last-child { border-bottom: 0; }
.health-indicator { width: .72rem; height: .72rem; margin-top: .28rem; border-radius: 50%; background: var(--muted); box-shadow: 0 0 0 4px color-mix(in srgb, var(--muted) 12%, transparent); }
.health-item.healthy .health-indicator { background: var(--success); box-shadow: 0 0 0 4px color-mix(in srgb, var(--success) 12%, transparent); }
.health-item.warning .health-indicator { background: var(--warning); box-shadow: 0 0 0 4px color-mix(in srgb, var(--warning) 12%, transparent); }
.health-item.error .health-indicator { background: var(--danger); box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 12%, transparent); }
.health-item.info .health-indicator { background: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
.health-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.health-detail { margin: .28rem 0 0; }
.health-detail a { color: var(--accent-emphasis); font-weight: 700; }
.health-item.healthy .health-status { color: var(--success); }
.health-item.warning .health-status { color: var(--warning); }
.health-item.error .health-status { color: var(--danger); }
.health-item.info .health-status { color: var(--accent-emphasis); }
.system-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
progress { width: 100%; height: .65rem; border: 0; border-radius: 999px; overflow: hidden; background: var(--panel-strong); }
progress::-webkit-progress-bar { background: var(--panel-strong); }
progress::-webkit-progress-value { background: var(--accent-gradient); }
progress::-moz-progress-bar { background: var(--accent-gradient); }
.details { display: grid; grid-template-columns: auto 1fr; gap: .6rem 1rem; margin: 0; }
.details dt { color: var(--muted); }
.details dd { margin: 0; text-align: right; overflow-wrap: anywhere; }

.chart-toolbar { display: flex; align-items: flex-end; justify-content: flex-end; flex-wrap: wrap; gap: .65rem; margin-bottom: .85rem; }
.chart-jump-field { width: 10.5rem; }
.chart-bars-field { width: 8rem; }
.chart-bars-field input { text-align: right; }
.chart-scroll { overflow-x: auto; padding-bottom: .3rem; }
.chart { display: block; height: 12rem; min-width: 100%; }
.chart-bar { fill: var(--accent); transition: fill .15s ease; }
.chart-bar:hover { fill: var(--accent-hover); }
.chart-bar-empty { fill: var(--border); }
.chart-bar-empty:hover { fill: var(--muted); }
.chart-range { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: .6rem; color: var(--muted); font-size: .78rem; }

dialog { width: min(36rem, calc(100% - 2rem)); max-height: calc(100vh - 2rem); padding: 0; border: 1px solid var(--border); border-radius: .9rem; background: var(--panel); color: var(--text); box-shadow: 0 28px 90px rgba(0, 0, 0, .5); }
dialog.wide { width: min(46rem, calc(100% - 2rem)); }
dialog::backdrop { background: rgba(3, 7, 18, .72); backdrop-filter: blur(4px); }
.dialog-header, .dialog-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.15rem; }
.dialog-header { border-bottom: 1px solid var(--border); }
.dialog-footer { border-top: 1px solid var(--border); justify-content: flex-end; }
.dialog-body { padding: 1.15rem; overflow: auto; }
.dialog-body form { display: grid; gap: .85rem; }
.check { display: flex; align-items: center; gap: .55rem; color: var(--text); }
.check input { width: 1rem; min-height: 1rem; }
.license-output { white-space: pre; }

.public-shell { width: min(78rem, 100%); min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(20rem, .75fr); align-items: center; gap: clamp(1.25rem, 4vw, 4rem); margin: 0 auto; padding: clamp(1rem, 4vw, 3rem); }
.public-intro { min-width: 0; }
.public-intro > h1 { max-width: 14ch; }
.public-intro > p { max-width: 48rem; }
.public-brand { padding: 0 0 2rem; }
.public-shell .guide-grid { grid-template-columns: 1fr; }
.login-card { width: 100%; padding: 1.5rem; border: 1px solid var(--border); border-radius: 1rem; background: var(--panel); box-shadow: var(--shadow); }
.login-card form { display: grid; gap: .9rem; margin-top: 1.4rem; }

@media (max-width: 900px) {
  .public-shell { max-width: 48rem; grid-template-columns: 1fr; align-items: start; }
  .public-intro { padding-top: 1rem; }
  .login-card { margin-bottom: 2rem; }
  .layout { grid-template-columns: 1fr; }
  .sidebar {
    position: sticky;
    top: 0;
    z-index: 50;
    width: 100%;
    height: auto;
    display: grid;
    grid-template-areas: "brand footer" "nav nav";
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: .65rem 1rem;
    padding: .7rem clamp(.75rem, 3vw, 1.25rem) .55rem;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--panel) 97%, transparent);
    box-shadow: 0 10px 30px rgba(0, 0, 0, .14);
  }
  .brand { grid-area: brand; min-width: 0; padding: 0; }
  .brand-logo { width: 2.15rem; height: 2.15rem; }
  .nav {
    grid-area: nav;
    display: grid;
    grid-template-columns: repeat(5, minmax(max-content, 1fr));
    gap: .3rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    padding: 0 0 .2rem;
  }
  .nav a { padding: .58rem .7rem; text-align: center; white-space: nowrap; }
  .nav a[aria-current="page"] { box-shadow: inset 0 -3px var(--accent); }
  .sidebar-footer { grid-area: footer; position: static; display: flex; align-items: center; gap: .45rem; }
  .sidebar-footer form { display: flex; }
  .theme-control { display: block; }
  .theme-control > span { display: none; }
  .theme-control select, .sidebar-footer .button { width: auto; min-height: 2.25rem; padding-top: .4rem; padding-bottom: .4rem; }
  .main { padding-top: 1.25rem; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .sidebar { gap: .55rem .65rem; padding-inline: .65rem; }
  .brand { gap: .55rem; }
  .brand small { display: none; }
  .nav a { padding: .55rem .5rem; font-size: .8rem; }
  .theme-control select { max-width: 5.2rem; }
  .sidebar-footer .button { padding-inline: .65rem; }
  .stats, .system-grid, .guide-grid { grid-template-columns: 1fr; }
  .topbar, .panel-header, .pagination { align-items: stretch; flex-direction: column; }
  .page-links { overflow-x: auto; }
  .hide-small { display: none; }
  .row-actions { justify-content: flex-start; }
  .dialog-footer { flex-wrap: wrap; }
  .copy-field { align-items: stretch; flex-direction: column; }
}

@media (max-width: 390px) {
  .brand strong { font-size: .9rem; }
  .brand-logo { width: 1.9rem; height: 1.9rem; }
  .nav a { padding-inline: .42rem; font-size: .74rem; }
  .sidebar-footer .button { padding-inline: .55rem; font-size: .78rem; }
}
`;
