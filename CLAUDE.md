# Gmail Forwarder — Chrome Extension

Forwards all emails in the current Gmail paginated view to a fixed recipient address. The user opens an email from a label or search results (so the "N of Total" pagination counter is present), clicks the toolbar button, and the extension forwards each email one by one, navigating to the next automatically.

## File structure

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest — declares permissions, service worker, content scripts |
| `background.js` | Service worker — listens for toolbar button click, messages content script |
| `utils.js` | Generic helpers: `sleep`, `waitFor`, `findButton`, `typeInto` |
| `ui.js` | DOM UI: error toast container, stop button |
| `gmail.js` | Gmail-specific logic: `readCounter`, `currentMessageId`, `forwardOne` |
| `content.js` | Entry point: `RECIPIENT` config, `forwardAll` loop, message listener |

Content scripts are injected in dependency order: `utils.js` → `ui.js` → `gmail.js` → `content.js`. They share a single global scope, so later files can call functions defined in earlier ones.

## How it works

1. User opens an email from a label/search view (the "3 of 25" counter must be visible).
2. User clicks the extension toolbar button.
3. `background.js` sends `{ action: 'forwardAll' }` to the content script. If the content script isn't yet injected (tab was open before extension loaded), it injects `content.js` via `chrome.scripting.executeScript` first.
4. `forwardAll` validates: message ID in URL + pagination counter both present.
5. Loop: `forwardOne` → click "Older" nav button → repeat until out of emails or user stops.

### `forwardOne` details

- Records the baseline `[role="combobox"]` count (Gmail's search bar is always one).
- Sends a trusted `f` keypress via CDP (`pressForward` message → `background.js` → `chrome.debugger` / `Input.dispatchKeyEvent`) to trigger Gmail's Forward keyboard shortcut.
- Waits for a *new* combobox above the baseline count (the compose To field).
- Types the recipient with `execCommand('insertText')` — React's synthetic event system ignores direct `value` assignment.
- Tabs to confirm the address chip, clicks Send, waits for combobox count to return to baseline.

## Key gotchas

- **`isTrusted` filter**: Gmail ignores synthetic `KeyboardEvent`s for shortcuts. The Forward button is buried in a menu that closes too fast to click reliably. Instead, `background.js` uses `chrome.debugger` + `Input.dispatchKeyEvent` (CDP) to dispatch a real trusted `f` keypress — Gmail's Forward shortcut. This requires the `"debugger"` permission in `manifest.json` and Gmail keyboard shortcuts to be enabled (Settings → General → Keyboard shortcuts on).
- **`isTrusted` filter (clicks)**: Programmatic `.click()` calls work for most buttons but Gmail's menu items close before they can be clicked. The CDP approach avoids menus entirely.
- **`[role="combobox"]` is not unique**: Gmail's search bar always matches it. Track count before/after compose opens rather than checking for presence/absence.
- **Direct message links vs. list view**: `#inbox/FMfcgzQ...` URLs pass the message ID check but have no pagination counter. `readCounter()` returning null is the correct guard — not just `currentMessageId()`.
- **Tab was open before extension load**: `chrome.tabs.sendMessage` rejects if the content script isn't injected yet. `background.js` catches this and injects on demand.

## Recipient config

Edit the `RECIPIENT` constant at the top of `content.js`:

```js
const RECIPIENT = 'aceptar@facturaelectronica.cr';
```

## Loading the extension

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. After any code change, click the reload icon on the extension card

No build step required.