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

// Paste a string into a focused element using execCommand, which fires the
// internal input events Gmail's React layer listens to.
function pasteInto(el, text) {
  el.focus();
  document.execCommand('insertText', false, text);
}