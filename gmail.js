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
  console.log('[Gmail Forwarder] forwardOne start, baseCount=', baseCount);

  // Dump all aria-label / data-tooltip values to help diagnose missing buttons.
  const allLabeled = [...document.querySelectorAll('[aria-label],[data-tooltip]')].map(
    (el) => (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').trim()
  ).filter(Boolean);
  console.log('[Gmail Forwarder] labeled elements:', allLabeled);

  // Forward may be hidden under "More email options" (⋮) in the reply area.
  // There are two such buttons — we want the last one (reply area, not toolbar).
  // The menu closes quickly, so re-open it inside the waitFor loop as needed.
  console.log('[Gmail Forwarder] waiting for Forward button…');
  let lastMoreClick = 0;
  const fwdBtn = await waitFor(() => {
    // Forward visible directly (aria-label) or as an open menuitem (textContent).
    const btn = findButton(/^Forward$/i) ||
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (el) => /forward/i.test(el.textContent?.trim())
      );
    if (btn) return btn;

    // Not visible — open the More menu (throttled: at most once per second).
    if (Date.now() - lastMoreClick > 1000) {
      const moreBtns = [...document.querySelectorAll('[aria-label],[data-tooltip]')].filter((el) => {
        const label = el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '';
        return /^More email options$/i.test(label) || /^More options$/i.test(label);
      });
      const moreBtn = moreBtns[moreBtns.length - 1] ?? null;
      if (moreBtn) {
        moreBtn.scrollIntoView({ block: 'center' });
        moreBtn.click();
        lastMoreClick = Date.now();
        console.log('[Gmail Forwarder] (re)opened More menu');
      }
    }
    return null;
  }, 10000);
  console.log('[Gmail Forwarder] found Forward button, clicking');
  fwdBtn.click();

  // Wait for a NEW combobox to appear — that's the compose To field.
  console.log('[Gmail Forwarder] waiting for compose To field (combobox count > ', baseCount, ')…');
  const toField = await waitFor(() => {
    const boxes = document.querySelectorAll('[role="combobox"]');
    return boxes.length > baseCount ? boxes[boxes.length - 1] : null;
  });

  console.log('[Gmail Forwarder] compose To field found, typing recipient…');
  await sleep(500); // wait before typing
  // Type the recipient address.
  await typeInto(toField, RECIPIENT);

  // Tab to confirm the address chip.
  toField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
  await sleep(300);

  // Click the Send button.
  console.log('[Gmail Forwarder] waiting for Send button…');
  const sendBtn = await waitFor(() =>
    [...document.querySelectorAll('div[role="button"], button')].find(
      (el) => /^Send\b/i.test(el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || el.textContent)
    )
  );
  console.log('[Gmail Forwarder] clicking Send');
  sendBtn.click();

  // Wait until the compose window closes (combobox count back to baseline).
  console.log('[Gmail Forwarder] waiting for compose window to close…');
  await waitFor(() => document.querySelectorAll('[role="combobox"]').length <= baseCount);
  await sleep(600); // brief pause before moving on
}