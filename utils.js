const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeout = 6000, interval = 100) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const el = fn();
    if (el) return el;
    await sleep(interval);
  }
  throw new Error('waitFor timed out');
}

// Find a button/div by its aria-label or data-tooltip text.
function findButton(labelRegex) {
  return [...document.querySelectorAll('[aria-label], [data-tooltip]')].find((el) => {
    const label = el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '';
    return labelRegex.test(label);
  }) || null;
}

// Type a string into a focused element using execCommand, which fires the
// internal input events Gmail's React layer listens to.
async function typeInto(el, text) {
  el.focus();
  for (const char of text) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    document.execCommand('insertText', false, char);
    el.dispatchEvent(new KeyboardEvent('keyup',   { key: char, bubbles: true }));
    await sleep(25);
  }
}