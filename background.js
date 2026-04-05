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
