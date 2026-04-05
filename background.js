// When the toolbar button is clicked, tell the content script to start.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url?.includes('mail.google.com')) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'forwardAll' });
  } catch {
    // Content script not injected yet (tab was open before extension loaded).
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.tabs.sendMessage(tab.id, { action: 'forwardAll' });
  }
});

// Content script requests a trusted keypress via the Chrome Debugger Protocol.
// Synthetic KeyboardEvents are blocked by Gmail (isTrusted=false); CDP events are not.
// msg: { action: 'pressKey', key: 'f', code: 'KeyF', keyCode: 70 }
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'pressKey') return;
  const target = { tabId: sender.tab.id };
  const keyDown = { type: 'keyDown', key: msg.key, code: msg.code, windowsVirtualKeyCode: msg.keyCode, nativeVirtualKeyCode: msg.keyCode, text: msg.key };
  (async () => {
    try {
      await new Promise((res, rej) =>
        chrome.debugger.attach(target, '1.3', () =>
          chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res()
        )
      );
      await new Promise((res) =>
        chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', keyDown, res)
      );
      await new Promise((res) =>
        chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', { ...keyDown, type: 'keyUp', text: '' }, res)
      );
    } catch (err) {
      console.error('[Gmail Forwarder] pressForward error:', err);
    } finally {
      await new Promise((res) => chrome.debugger.detach(target, res));
    }
    sendResponse({ ok: true });
  })();
  return true; // keep message channel open for async sendResponse
});
