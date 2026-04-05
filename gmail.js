// Read Gmail's "N of Total" counter, return { current, total } or null.
function readCounter() {
  // Gmail renders this as e.g. "3 of 25" inside a <span> in the toolbar.
  const spans = [...document.querySelectorAll('span')];
  for (const s of spans) {
    const m = s.textContent.trim().match(/^(\d+)\s+of\s+(\d+)$/);
    if (m) return { current: +m[1], total: +m[2] };
  }
  return null;
}

// Return the message ID portion of the current URL (null if in list/label view).
// Gmail message IDs are purely alphanumeric (e.g. FMfcgzQgLFkFwsJDtqrrpczLwCXBZjvb).
// Label/filter paths contain encoded chars (%, _, -) so they won't match.
function currentMessageId() {
  const parts = window.location.hash.split('/');
  const last = parts[parts.length - 1];
  return /^[A-Za-z0-9]{16,}$/.test(last) ? last : null;
}

async function forwardOne() {
  // Record baseline combobox count (e.g. the search bar is always one).
  const baseCount = document.querySelectorAll('[role="combobox"]').length;

  // Click Gmail's Forward button — synthetic key events are blocked (isTrusted=false).
  const fwdBtn = await waitFor(() => findButton(/^Forward$/i));
  fwdBtn.click();

  // Wait for a NEW combobox to appear — that's the compose To field.
  const toField = await waitFor(() => {
    const boxes = document.querySelectorAll('[role="combobox"]');
    return boxes.length > baseCount ? boxes[boxes.length - 1] : null;
  });

  // Type the recipient address.
  await typeInto(toField, RECIPIENT);

  // Tab to confirm the address chip.
  toField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
  await sleep(300);

  // Click the Send button.
  const sendBtn = await waitFor(() =>
    [...document.querySelectorAll('div[role="button"], button')].find(
      (el) => /^Send\b/i.test(el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || el.textContent)
    )
  );
  sendBtn.click();

  // Wait until the compose window closes (combobox count back to baseline).
  await waitFor(() => document.querySelectorAll('[role="combobox"]').length <= baseCount);
  await sleep(600); // brief pause before moving on
}