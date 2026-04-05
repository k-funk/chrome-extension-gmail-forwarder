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

  const total = counter.total - counter.current; // emails remaining after this one

  let forwarded = 0;

  try {
    while (true) {
      if (stopRequested) break;

      await forwardOne();
      forwarded++;

      // Stop if we've hit the total we calculated upfront.
      if (total !== null && forwarded >= total + 1) break;

      if (stopRequested) break;

      // Click Gmail's "Older" navigation button to move to the next email.
      const idBefore = currentMessageId();
      const olderBtn = findButton(/\bOlder\b/i);
      if (!olderBtn) break;
      olderBtn.click();
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