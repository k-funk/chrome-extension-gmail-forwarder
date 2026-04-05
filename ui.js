// ── Error toasts ──────────────────────────────────────────────────────────────
function getToastContainer() {
  let container = document.getElementById('gmail-forwarder-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gmail-forwarder-toasts';
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '99999',
      display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end',
    });
    document.body.appendChild(container);
  }
  return container;
}

function showError(err) {
  console.error('[Gmail Forwarder]', err);
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    maxWidth: '360px', padding: '12px 16px', background: '#b71c1c', color: '#fff',
    borderRadius: '6px', fontSize: '13px', fontFamily: 'sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: '12px',
  });

  const msg = document.createElement('span');
  msg.textContent = `Gmail Forwarder error: ${err?.message ?? err}`;
  msg.style.flex = '1';

  const close = document.createElement('button');
  close.textContent = '✕';
  Object.assign(close.style, {
    background: 'none', border: 'none', color: '#fff', fontSize: '14px',
    cursor: 'pointer', padding: '0', lineHeight: '1', flexShrink: '0',
  });
  close.addEventListener('click', () => toast.remove());

  toast.appendChild(msg);
  toast.appendChild(close);
  getToastContainer().appendChild(toast);
}

// ── Stop button ───────────────────────────────────────────────────────────────
let stopRequested = false;

function showStopButton() {
  const btn = document.createElement('button');
  btn.id = 'gmail-forwarder-stop';
  Object.assign(btn.style, {
    position: 'fixed', top: '24px', right: '24px', zIndex: '99999',
    padding: '10px 14px', background: 'rgba(255,255,255,0.95)', color: '#222',
    border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px',
    fontFamily: 'sans-serif', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)',
    display: 'flex', alignItems: 'center', gap: '10px',
  });

  const label = document.createElement('span');
  label.textContent = 'Stop Forwarding';

  const square = document.createElement('span');
  Object.assign(square.style, {
    width: '12px', height: '12px', background: '#d93025',
    borderRadius: '2px', flexShrink: '0', display: 'inline-block',
  });

  btn.appendChild(label);
  btn.appendChild(square);

  btn.addEventListener('click', () => {
    stopRequested = true;
    label.textContent = 'Stopping…';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  });
  btn._label = label;
  document.body.appendChild(btn);
}

function updateProgress(index, total) {
  const btn = document.getElementById('gmail-forwarder-stop');
  if (btn?._label && !stopRequested) btn._label.textContent = `Forwarding ${index}/${total}`;
}

function removeStopButton() {
  document.getElementById('gmail-forwarder-stop')?.remove();
}