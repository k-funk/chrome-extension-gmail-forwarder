// ── Config ────────────────────────────────────────────────────────────────────
const RECIPIENT = 'aceptar@facturaelectronica.cr';
// ─────────────────────────────────────────────────────────────────────────────

async function forwardAll() {
  // Must be inside a paginated email list view (needs the "N of Total" toolbar counter).
  if (!currentMessageId()) {
    alert('Gmail Forwarder: open an email from a label or search results first, then click the button.');
    return;
  }

  const counter = readCounter();
  if (!counter) {
    alert('Gmail Forwarder: no pagination counter found — open an email from a label or search results view, not a direct link.');
    return;
  }

  stopRequested = false;
  showStopButton();

  const totalToSend = counter.total - counter.current + 1; // includes current email
  let forwarded = 0;

  try {
    while (true) {
      if (stopRequested) break;

      updateProgress(forwarded + 1, totalToSend);
      await forwardOne();
      forwarded++;

      if (forwarded >= totalToSend) break;

      if (stopRequested) break;

      // Send trusted 'j' keypress (Gmail's "next email" shortcut) to navigate.
      const idBefore = currentMessageId();
      await chrome.runtime.sendMessage({ action: 'pressKey', key: 'j', code: 'KeyJ', keyCode: 74 });
      await sleep(800);

      // If the URL didn't change, we've run out of emails.
      if (currentMessageId() === idBefore) break;
    }
  } catch (err) {
    showError(err);
    throw err;
  } finally {
    removeStopButton();
  }

  const reason = stopRequested ? 'stopped by user' : 'done';
  console.log(`[Gmail Forwarder] ${reason} — forwarded ${forwarded} email(s) to ${RECIPIENT}.`);
}

// Listen for the toolbar-button click relayed from background.js.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'forwardAll') forwardAll().catch(showError);
});