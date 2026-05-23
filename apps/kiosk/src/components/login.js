import { validateCommunityCode, loginToCommunity } from '../services/auth.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">Nolt Mathis Construction Management</div>
      <div class="login-title">SeniorStudio</div>
      <div class="login-subtitle">Enter your community code to begin</div>
      <div class="code-entry">
        <input type="text" class="code-input" id="communityCodeInput"
               placeholder="Community Code" maxlength="10" autocomplete="off">
        <button class="code-submit" id="codeSubmitBtn">Continue</button>
      </div>
      <div class="code-error" id="codeError"></div>
    </div>
  `;

  const input = container.querySelector('#communityCodeInput');
  const btn = container.querySelector('#codeSubmitBtn');
  const error = container.querySelector('#codeError');

  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
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
