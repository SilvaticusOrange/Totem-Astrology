<?php
/**
 * Password-protected moderation queue for Totem Connections listings.
 */
declare(strict_types=1);

require __DIR__ . '/api/connections-lib.php';

connectionsStartAdminSession();

$pageTitle = 'Connections Moderation — TotemAstrology.com';
$configured = connectionsAdminConfigured();
$authenticated = connectionsIsAdminAuthenticated();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
  <link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css?v=20260882">
  <style>
    .admin-page {
      max-width: 52rem;
      margin: 0 auto;
      padding: 2rem 1rem 4rem;
    }

    .admin-panel {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }

    .admin-panel + .admin-panel {
      margin-top: 1.25rem;
    }

    .admin-meta {
      color: var(--text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
      margin: 0 0 1rem;
    }

    .admin-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .admin-tab {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-muted);
      border-radius: 999px;
      padding: 0.45rem 0.9rem;
      cursor: pointer;
      font: inherit;
    }

    .admin-tab.is-active {
      border-color: rgba(201, 169, 98, 0.45);
      color: var(--gold-light);
      background: rgba(201, 169, 98, 0.08);
    }

    .admin-queue {
      display: grid;
      gap: 1rem;
    }

    .admin-item {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.1rem;
      background: rgba(255, 255, 255, 0.02);
    }

    .admin-item__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .admin-item__name {
      margin: 0;
      font-family: var(--font-display);
      color: var(--gold-light);
      font-size: 1.25rem;
    }

    .admin-item__date {
      color: var(--text-muted);
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .admin-item__intro,
    .admin-item__email,
    .admin-item__animals {
      margin: 0 0 0.75rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .admin-item__animals strong {
      color: var(--text);
    }

    .admin-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .admin-empty {
      color: var(--text-muted);
      margin: 0;
    }

    .admin-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="page-wrap">
    <main class="admin-page">
      <div class="section-header">
        <span class="section-label">Private</span>
        <h1>Connections Moderation</h1>
        <p>Review directory submissions before they appear on the public Connections page.</p>
      </div>

      <?php if (!$configured): ?>
        <div class="admin-panel">
          <p class="admin-meta">
            Admin is not configured yet. Copy <code>data/connections-config.example.php</code> to
            <code>data/connections-config.php</code> on the server, set
            <code>adminPassword</code> to the password you want, and reload this page.
          </p>
        </div>
      <?php elseif (!$authenticated): ?>
        <div class="admin-panel">
          <form id="admin-login-form" class="bazi-form" novalidate>
            <div class="form-group">
              <label for="admin-password">Admin password</label>
              <input type="password" id="admin-password" name="password" autocomplete="current-password" required>
            </div>
            <button type="submit" class="btn btn-primary">Sign in</button>
            <div id="admin-login-message" class="form-message" role="alert" hidden></div>
          </form>
        </div>
      <?php else: ?>
        <div class="admin-panel">
          <div class="admin-toolbar">
            <p class="admin-meta" id="admin-summary">Loading queue…</p>
            <button type="button" class="btn btn-outline" id="admin-logout">Sign out</button>
          </div>

          <div class="admin-tabs" role="tablist" aria-label="Moderation queues">
            <button type="button" class="admin-tab is-active" data-queue="listings" data-status="pending">Listings pending</button>
            <button type="button" class="admin-tab" data-queue="listings" data-status="approved">Approved</button>
            <button type="button" class="admin-tab" data-queue="listings" data-status="rejected">Rejected</button>
            <button type="button" class="admin-tab" data-queue="birth" data-status="birth">Birth ID review</button>
          </div>

          <div id="admin-queue" class="admin-queue">
            <p class="admin-empty">Loading…</p>
          </div>
          <div id="admin-queue-message" class="form-message" role="status" hidden></div>
        </div>
      <?php endif; ?>
    </main>
  </div>

  <script>
    const ADMIN_API = 'api/connections-admin.php';

    function showAdminMessage(el, message, type = 'info') {
      if (!el) return;
      el.textContent = message;
      el.className = 'form-message form-message--' + type + ' visible';
      el.hidden = false;
    }

    async function adminFetch(action, payload = null) {
      const options = {
        method: payload ? 'POST' : 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      };
      if (payload) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(payload);
      }
      const response = await fetch(ADMIN_API, options);
      const raw = await response.text();
      let data = {};
      if (raw) {
        try { data = JSON.parse(raw); } catch {}
      }
      if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
      }
      return data;
    }

    function formatDate(unixSeconds) {
      if (!unixSeconds) return 'Unknown date';
      return new Date(unixSeconds * 1000).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatElementAnimal(profile, pillar) {
      const animal = profile[pillar] ?? '';
      const element = profile.elements?.[pillar] ?? '';
      return element ? `${element} ${animal}` : animal;
    }

    function renderAnimalLine(profile) {
      return `<strong>Spirit</strong> ${escapeHtml(formatElementAnimal(profile, 'spirit'))} · ` +
        `<strong>Mind</strong> ${escapeHtml(formatElementAnimal(profile, 'mental'))} · ` +
        `<strong>Heart</strong> ${escapeHtml(formatElementAnimal(profile, 'emotional'))} · ` +
        `<strong>Body</strong> ${escapeHtml(formatElementAnimal(profile, 'physical'))}`;
    }

    function renderItem(profile, status) {
      const actions = [];
      if (status === 'pending') {
        actions.push(`<button type="button" class="btn btn-primary" data-action="approve" data-id="${escapeHtml(profile.id)}">Approve</button>`);
        actions.push(`<button type="button" class="btn btn-outline" data-action="reject" data-id="${escapeHtml(profile.id)}">Reject</button>`);
      } else if (status === 'approved') {
        actions.push(`<button type="button" class="btn btn-outline" data-action="reject" data-id="${escapeHtml(profile.id)}">Move to rejected</button>`);
      } else {
        actions.push(`<button type="button" class="btn btn-primary" data-action="approve" data-id="${escapeHtml(profile.id)}">Approve</button>`);
      }
      actions.push(`<button type="button" class="btn btn-outline" data-action="delete" data-id="${escapeHtml(profile.id)}">Delete</button>`);

      return `
        <article class="admin-item">
          <div class="admin-item__header">
            <h2 class="admin-item__name">${escapeHtml(profile.displayName)}</h2>
            <span class="admin-item__date">${escapeHtml(formatDate(profile.createdAt))}</span>
          </div>
          <p class="admin-item__animals">${renderAnimalLine(profile)}</p>
          ${profile.intro ? `<p class="admin-item__intro">${escapeHtml(profile.intro)}</p>` : ''}
          ${profile.contactEmail ? `<p class="admin-item__email"><a href="mailto:${escapeHtml(profile.contactEmail)}">${escapeHtml(profile.contactEmail)}</a></p>` : ''}
          <div class="admin-actions">${actions.join('')}</div>
        </article>`;
    }

    function renderBirthItem(item) {
      const contact = [item.email, item.phone].filter(Boolean).map(escapeHtml).join(' · ') || 'No contact on file';
      const datePending = item.birthVerificationStatus === 'pending';
      const timePending = item.birthTimeVerificationStatus === 'pending';
      const parts = [];

      if (datePending) {
        const docLabel = escapeHtml(item.birthIdOriginalName || 'View ID');
        parts.push(`
          <div class="admin-birth-block">
            <p class="admin-item__animals"><strong>Date ID review</strong> · claimed ${escapeHtml(item.birthDate || '—')} · confirms 3 of 4 animals</p>
            <p class="admin-item__email"><a href="${ADMIN_API}?birthId=${encodeURIComponent(item.id)}&kind=date" target="_blank" rel="noopener">Open ID (${docLabel})</a></p>
            <p class="admin-item__intro">Confirm day / month / year on the ID matches the claim, then approve Verified.</p>
            <div class="admin-actions">
              <button type="button" class="btn btn-primary" data-action="approve-birth" data-id="${escapeHtml(item.id)}">Approve Verified (date)</button>
              <button type="button" class="btn btn-outline" data-action="reject-birth" data-id="${escapeHtml(item.id)}">Reject date</button>
            </div>
          </div>`);
      }

      if (timePending) {
        const docLabel = escapeHtml(item.birthTimeIdOriginalName || 'View time proof');
        parts.push(`
          <div class="admin-birth-block">
            <p class="admin-item__animals"><strong>Time proof review</strong> · claimed ${escapeHtml(item.birthTime || '—')} · golden badge / 4th animal</p>
            <p class="admin-item__email"><a href="${ADMIN_API}?birthId=${encodeURIComponent(item.id)}&kind=time" target="_blank" rel="noopener">Open birth cert / sworn declaration (${docLabel})</a></p>
            <p class="admin-item__intro">Confirm the birth time on the certificate or sworn declaration matches the claim.</p>
            <div class="admin-actions">
              <button type="button" class="btn btn-primary" data-action="approve-birth-time" data-id="${escapeHtml(item.id)}">Approve Time Verified</button>
              <button type="button" class="btn btn-outline" data-action="reject-birth-time" data-id="${escapeHtml(item.id)}">Reject time</button>
            </div>
          </div>`);
      }

      return `
        <article class="admin-item">
          <div class="admin-item__header">
            <h2 class="admin-item__name">${escapeHtml(item.displayName || item.username)}</h2>
            <span class="admin-item__date">${escapeHtml(formatDate(item.updatedAt || item.createdAt))}</span>
          </div>
          <p class="admin-item__intro">@${escapeHtml(item.username)} · ${contact}</p>
          ${parts.join('')}
        </article>`;
    }

    <?php if ($configured && !$authenticated): ?>
    document.getElementById('admin-login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const messageEl = document.getElementById('admin-login-message');
      const password = document.getElementById('admin-password')?.value || '';
      try {
        await adminFetch('login', { action: 'login', password });
        location.reload();
      } catch (error) {
        showAdminMessage(messageEl, error.message || 'Could not sign in.', 'error');
      }
    });
    <?php endif; ?>

    <?php if ($configured && $authenticated): ?>
    let queueData = null;
    let activeQueue = 'listings';
    let activeStatus = 'pending';

    const summaryEl = document.getElementById('admin-summary');
    const queueEl = document.getElementById('admin-queue');
    const messageEl = document.getElementById('admin-queue-message');

    function renderQueue() {
      document.querySelectorAll('.admin-tab').forEach((tab) => {
        const isActive = activeQueue === 'birth'
          ? tab.dataset.queue === 'birth'
          : tab.dataset.queue === 'listings' && tab.dataset.status === activeStatus;
        tab.classList.toggle('is-active', isActive);
      });

      const counts = queueData?.counts || { pending: 0, approved: 0, rejected: 0, birthPending: 0 };
      summaryEl.textContent =
        `${counts.pending} listings pending · ${counts.approved} approved · ${counts.rejected} rejected · ${counts.birthPending || 0} birth ID reviews`;

      if (activeQueue === 'birth') {
        const items = queueData?.birthVerifications || [];
        if (!items.length) {
          queueEl.innerHTML = '<p class="admin-empty">No birth ID verifications waiting.</p>';
          return;
        }
        queueEl.innerHTML = items.map((item) => renderBirthItem(item)).join('');
        return;
      }

      const items = queueData?.profiles?.[activeStatus] || [];
      if (!items.length) {
        queueEl.innerHTML = `<p class="admin-empty">No ${activeStatus} listings.</p>`;
        return;
      }

      queueEl.innerHTML = items.map((profile) => renderItem(profile, activeStatus)).join('');
    }

    async function loadQueue() {
      queueData = await adminFetch();
      renderQueue();
    }

    async function handleAction(action, id) {
      if (action === 'delete' && !window.confirm('Delete this listing permanently?')) {
        return;
      }
      if (action === 'approve-birth' || action === 'reject-birth' || action === 'approve-birth-time' || action === 'reject-birth-time') {
        await adminFetch('action', { action, userId: id });
        const messages = {
          'approve-birth': 'Date Verified approved.',
          'reject-birth': 'Date verification rejected.',
          'approve-birth-time': 'Time Verified (golden) approved.',
          'reject-birth-time': 'Time verification rejected.',
        };
        showAdminMessage(messageEl, messages[action] || 'Updated.', 'success');
        await loadQueue();
        return;
      }
      await adminFetch('action', { action, id });
      const labels = { approve: 'approved', reject: 'rejected', delete: 'deleted' };
      showAdminMessage(messageEl, `Listing ${labels[action] || action}.`, 'success');
      await loadQueue();
    }

    document.querySelectorAll('.admin-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeQueue = tab.dataset.queue || 'listings';
        if (activeQueue === 'birth') {
          activeStatus = 'birth';
        } else {
          activeStatus = tab.dataset.status || 'pending';
        }
        renderQueue();
      });
    });

    queueEl.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      try {
        await handleAction(button.dataset.action, button.dataset.id);
      } catch (error) {
        showAdminMessage(messageEl, error.message || 'Action failed.', 'error');
      }
    });

    document.getElementById('admin-logout')?.addEventListener('click', async () => {
      await adminFetch('logout', { action: 'logout' });
      location.reload();
    });

    loadQueue().catch((error) => {
      queueEl.innerHTML = '<p class="admin-empty">Could not load moderation queue.</p>';
      showAdminMessage(messageEl, error.message || 'Could not load queue.', 'error');
    });
    <?php endif; ?>
  </script>
</body>
</html>
