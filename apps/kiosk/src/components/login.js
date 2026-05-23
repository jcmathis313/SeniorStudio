import { validateCommunityCode, loginToCommunity } from '../services/auth.js';

const KEYBOARD_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
];

export function renderLogin(container) {
  const kbHtml = KEYBOARD_ROWS.map(row =>
    `<div class="kb-row">${row.map(k => {
      const cls = k === '⌫' ? 'kb-key kb-key--wide kb-key--delete' : 'kb-key';
      return `<button class="${cls}" data-key="${k}">${k}</button>`;
    }).join('')}</div>`
  ).join('');

  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">Nolt Mathis Construction Management</div>
      <div class="login-title">SeniorStudio</div>
      <div class="login-subtitle">Enter your community code to begin</div>
      <div class="code-entry">
        <input type="text" class="code-input" id="communityCodeInput"
               placeholder="Community Code" maxlength="10" autocomplete="off"
               inputmode="none">
        <button class="code-submit" id="codeSubmitBtn">Continue</button>
      </div>
      <div class="code-error" id="codeError"></div>
      <div class="virtual-keyboard" id="virtualKeyboard">
        ${kbHtml}
      </div>
    </div>
  `;

  const input = container.querySelector('#communityCodeInput');
  const btn = container.querySelector('#codeSubmitBtn');
  const error = container.querySelector('#codeError');

  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  container.querySelectorAll('.kb-key').forEach(key => {
    key.addEventListener('click', (e) => {
      e.preventDefault();
      const k = key.dataset.key;
      if (k === '⌫') {
        input.value = input.value.slice(0, -1);
      } else if (input.value.length < 10) {
        input.value += k;
      }
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
  });

  async function submitCode() {
    const code = input.value.trim();
    if (!code) return;
    error.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Checking...';

    const community = await validateCommunityCode(code);
    if (community) {
      loginToCommunity(community, 'user');
    } else {
      error.textContent = 'Invalid community code. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Continue';
    }
  }

  btn.addEventListener('click', submitCode);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitCode(); });
  input.focus();
}
