export const adminScript = String.raw`
const root = document.documentElement;
const themeSelect = document.querySelector('[data-theme-select]');
const savedTheme = localStorage.getItem('passky-admin-theme');
const preferredTheme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : preferredTheme;

root.dataset.theme = initialTheme;
if (themeSelect) themeSelect.value = initialTheme;

themeSelect?.addEventListener('change', () => {
  const theme = themeSelect.value === 'light' ? 'light' : 'dark';
  root.dataset.theme = theme;
  localStorage.setItem('passky-admin-theme', theme);
});

for (const trigger of document.querySelectorAll('[data-dialog-open]')) {
  trigger.addEventListener('click', () => {
    const dialog = document.getElementById(trigger.dataset.dialogOpen);
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  });
}

for (const trigger of document.querySelectorAll('[data-dialog-close]')) {
  trigger.addEventListener('click', () => {
    const dialog = trigger.closest('dialog');
    if (dialog instanceof HTMLDialogElement) dialog.close();
  });
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

document.querySelector('dialog[data-auto-open]')?.showModal();

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

for (const trigger of document.querySelectorAll('[data-copy-target]')) {
  trigger.addEventListener('click', async () => {
    const target = document.getElementById(trigger.dataset.copyTarget);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const original = trigger.textContent;
    try {
      await copyText(target.value);
      trigger.textContent = 'Copied';
    } catch {
      target.focus();
      target.select();
      trigger.textContent = 'Select and copy';
    }

    setTimeout(() => { trigger.textContent = original; }, 1800);
  });
}

for (const trigger of document.querySelectorAll('[data-download-target]')) {
  trigger.addEventListener('click', () => {
    const target = document.getElementById(trigger.dataset.downloadTarget);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const url = URL.createObjectURL(new Blob([target.value + '\n'], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'passky-licenses.txt';
    link.click();
    URL.revokeObjectURL(url);
  });
}

for (const select of document.querySelectorAll('[data-auto-submit]')) {
  select.addEventListener('change', () => select.form?.requestSubmit());
}

for (const field of document.querySelectorAll('[data-server-origin]')) {
  if (field instanceof HTMLInputElement) field.value = window.location.origin;
}

const secureConnection = window.location.protocol === 'https:';
const healthOverview = document.querySelector('[data-health-overview]');
if (healthOverview) {
  const serverErrors = Number(healthOverview.dataset.serverErrors || '0');
  healthOverview.textContent = serverErrors > 0 || !secureConnection ? 'Attention' : 'Ready';
}

const tlsCheck = document.querySelector('[data-health-tls]');
if (tlsCheck) {
  const status = tlsCheck.querySelector('.health-status');
  const detail = tlsCheck.querySelector('.health-detail');

  tlsCheck.classList.remove('info');
  tlsCheck.classList.add(secureConnection ? 'healthy' : 'error');
  if (status) status.textContent = secureConnection ? 'healthy' : 'error';
  if (detail) {
    if (secureConnection) {
      detail.textContent = 'This administrator session is protected with HTTPS.';
    } else {
      const burrowGateLink = document.createElement('a');
      burrowGateLink.href = 'https://burrowgate.org/';
      burrowGateLink.target = '_blank';
      burrowGateLink.rel = 'noopener noreferrer';
      burrowGateLink.textContent = 'BurrowGate';
      detail.replaceChildren(
        'This administrator session is using HTTP. Configure TLS with a reverse proxy before exposing Passky publicly. We recommend ',
        burrowGateLink,
        '.',
      );
    }
  }

  for (const healthStatus of ['healthy', 'warning', 'error']) {
    const counter = document.querySelector('[data-health-count="' + healthStatus + '"]');
    if (counter) {
      counter.textContent = String(document.querySelectorAll('.health-item.' + healthStatus).length);
    }
  }
}

const chartScroll = document.querySelector('[data-chart-scroll]');
const chartSvg = document.querySelector('[data-chart-svg]');
const chartBarsInput = document.querySelector('[data-chart-bars]');
const chartJumpInput = document.querySelector('[data-chart-jump]');

if (chartScroll && chartSvg && chartBarsInput) {
  const bars = Array.from(chartSvg.querySelectorAll('.chart-bar')).map((rect) => ({
    date: rect.dataset.date,
    count: Number(rect.dataset.count),
  }));
  const totalBars = bars.length;
  const chartLeftLabel = document.querySelector('[data-chart-left]');
  const chartRightLabel = document.querySelector('[data-chart-right]');
  const chartTotalLabel = document.querySelector('[data-chart-total]');
  let pxPerBar = 16;

  function currentLeftIndex() {
    return Math.max(0, Math.min(totalBars - 1, Math.floor(chartScroll.scrollLeft / pxPerBar)));
  }

  function scrollToIndex(index) {
    chartScroll.scrollLeft = index * pxPerBar;
  }

  function updateRange() {
    const scrollLeft = chartScroll.scrollLeft;
    const viewportWidth = chartScroll.clientWidth;
    const firstIndex = Math.max(0, Math.min(totalBars - 1, Math.floor(scrollLeft / pxPerBar)));
    const lastIndex = Math.max(firstIndex, Math.min(totalBars - 1, Math.ceil((scrollLeft + viewportWidth) / pxPerBar) - 1));

    let sum = 0;
    for (let i = firstIndex; i <= lastIndex; i++) sum += bars[i].count;

    if (chartLeftLabel) chartLeftLabel.textContent = bars[firstIndex].date;
    if (chartRightLabel) chartRightLabel.textContent = bars[lastIndex].date;
    if (chartTotalLabel) {
      chartTotalLabel.textContent = 'Total: ' + sum.toLocaleString() + (sum === 1 ? ' account' : ' accounts');
    }
    if (chartJumpInput && document.activeElement !== chartJumpInput) {
      chartJumpInput.value = bars[firstIndex].date;
    }
  }

  function applyZoom(anchorIndex) {
    const requested = Math.max(1, Math.round(Number(chartBarsInput.value) || 30));
    const viewportWidth = chartScroll.clientWidth || 1;
    const idealWidth = Math.round((viewportWidth / requested) * totalBars);
    const renderedWidth = Math.max(viewportWidth, idealWidth);

    chartSvg.setAttribute('width', String(renderedWidth));
    pxPerBar = renderedWidth / totalBars;

    if (anchorIndex !== undefined) scrollToIndex(anchorIndex);
    updateRange();
  }

  function jumpToDate(value) {
    if (!value) return;

    const target = new Date(value + 'T00:00:00Z');
    const first = new Date(bars[0].date + 'T00:00:00Z');
    const diffDays = Math.round((target - first) / 86400000);
    const clampedIndex = Math.max(0, Math.min(totalBars - 1, diffDays));

    scrollToIndex(clampedIndex);
    updateRange();
  }

  let scrollTicking = false;
  chartScroll.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateRange();
      scrollTicking = false;
    });
  });

  chartBarsInput.addEventListener('input', () => applyZoom(currentLeftIndex()));
  window.addEventListener('resize', () => applyZoom(currentLeftIndex()));

  if (chartJumpInput) {
    chartJumpInput.addEventListener('change', () => jumpToDate(chartJumpInput.value));
  }

  applyZoom();
  chartScroll.scrollLeft = chartScroll.scrollWidth;
  updateRange();
}
`;
