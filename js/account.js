import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  removeDirectoryListing,
  saveBirthDetails,
  submitBirthTimeVerification,
  submitBirthVerification,
  updateAccount,
  updateDirectoryListing,
} from './auth-client.js';
import { ANIMAL_FILES } from './totem-manifest.js';
import { renderTotemAnimalArt } from './totem-animal-art.js';
import {
  combinePhone,
  fillDialCodeSelect,
  splitPhone,
} from './country-dial-codes.js';

const GUIDE_PILLARS = [
  { key: 'spirit', label: 'Spirit' },
  { key: 'mental', label: 'Mind' },
  { key: 'emotional', label: 'Heart' },
  { key: 'physical', label: 'Body' },
];

function showMessage(el, message, type = 'info') {
  if (!el) return;
  el.textContent = message;
  el.className = `form-message form-message--${type} visible`;
  el.hidden = false;
}

function hideMessage(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
  el.className = 'form-message';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function listingStatusText(user) {
  const listing = user?.listing;
  if (!listing) {
    return 'You are not listed in the Totem Connections directory yet. Join from the Connections page when you are ready.';
  }
  const name = user?.username || listing.displayName || 'your account';
  const status = listing.status || 'pending';
  if (status === 'approved') {
    return `Your Directory Listing is live as “${name}”.`;
  }
  if (status === 'rejected') {
    return `Your Directory Listing for “${name}” was not approved. Edit and save below to send it back for review, or remove it.`;
  }
  return `Your Directory Listing for “${name}” is pending review.`;
}

function formatGuide(listing, pillar) {
  const animal = listing?.[pillar] || '';
  const element = listing?.elements?.[pillar] || '';
  return element ? `${element} ${animal}` : animal;
}

function fallbackAnimalArt(animalName) {
  const file = ANIMAL_FILES[animalName];
  if (!file) return '';
  return `<div class="bazi-totem-art-wrap">
    <img
      class="bazi-totem-art"
      src="assets/images/totems/${file}.png"
      alt="${escapeHtml(animalName)} totem"
      width="288"
      height="288"
      loading="lazy"
      decoding="async"
    />
  </div>`;
}

function guideArtHtml(listing, pillar) {
  const animal = listing?.[pillar] || '';
  const element = listing?.elements?.[pillar] || '';
  if (animal && element) {
    const art = renderTotemAnimalArt(animal, element);
    if (art) return art;
  }
  return fallbackAnimalArt(animal);
}

function listingPreviewHtml(listing) {
  const displayName = listing.displayName || 'Your listing';
  const intro = (listing.intro || '').trim();
  const email = (listing.contactEmail || '').trim();
  const guides = GUIDE_PILLARS.map(({ key, label }) => {
    const name = formatGuide(listing, key) || '—';
    return `<li class="listing-preview__guide">
      ${guideArtHtml(listing, key)}
      <div class="listing-preview__guide-meta">
        <span class="listing-preview__guide-pillar">${escapeHtml(label)}</span>
        <span class="listing-preview__guide-name">${escapeHtml(name)}</span>
      </div>
    </li>`;
  }).join('');

  const emailBubble = email
    ? `<p class="listing-bubble listing-bubble--email">
        <span class="listing-bubble__kicker">Public email</span>
        <span class="listing-bubble__value">${escapeHtml(email)}</span>
      </p>`
    : `<p class="listing-bubble listing-bubble--email listing-bubble--muted">
        <span class="listing-bubble__kicker">Public email</span>
        <span class="listing-bubble__value">No public email listed</span>
      </p>`;

  const introBubble = intro
    ? `<p class="listing-bubble listing-bubble--intro">
        <span class="listing-bubble__kicker">Short intro</span>
        <span class="listing-bubble__value">${escapeHtml(intro)}</span>
      </p>`
    : `<p class="listing-bubble listing-bubble--intro listing-bubble--muted">
        <span class="listing-bubble__kicker">Short intro</span>
        <span class="listing-bubble__value">No intro yet — add a short note below.</span>
      </p>`;

  return `<p class="listing-preview__label">How you appear</p>
    <div class="listing-preview__bubbles">
      <p class="listing-bubble listing-bubble--name">
        <span class="listing-bubble__kicker">Username</span>
        <span class="listing-bubble__value">${escapeHtml(displayName)}</span>
      </p>
      ${emailBubble}
      ${introBubble}
    </div>
    <ul class="listing-preview__guides" aria-label="Your four guides">${guides}</ul>`;
}

function birthBadge(user) {
  const dateStatus = user?.birthVerificationStatus || 'none';
  const timeStatus = user?.birthTimeVerificationStatus || 'none';
  const badges = [];
  if (dateStatus === 'verified') {
    badges.push('<span class="account-badge account-badge--verified">Verified</span>');
  } else if (dateStatus === 'pending') {
    badges.push('<span class="account-badge account-badge--pending">Verified pending</span>');
  } else if (dateStatus === 'rejected') {
    badges.push('<span class="account-badge account-badge--rejected">Verified rejected</span>');
  } else {
    badges.push('<span class="account-badge">Not verified</span>');
  }
  if (timeStatus === 'verified') {
    badges.push('<span class="account-badge account-badge--time">Time Verified</span>');
  } else if (timeStatus === 'pending') {
    badges.push('<span class="account-badge account-badge--pending">Time Verified pending</span>');
  } else if (timeStatus === 'rejected') {
    badges.push('<span class="account-badge account-badge--rejected">Time Verified rejected</span>');
  }
  return badges.join(' ');
}

function birthStatusCopy(user) {
  const dateStatus = user?.birthVerificationStatus || 'none';
  const timeStatus = user?.birthTimeVerificationStatus || 'none';
  const lines = [];

  if (dateStatus === 'verified') {
    lines.push(
      `Verified birth date: ${user.birthDate || '—'} (3 of 4 animals).${
        user.birthVerifiedAt ? ` Confirmed ${new Date(user.birthVerifiedAt * 1000).toLocaleDateString()}.` : ''
      }`
    );
  } else if (dateStatus === 'pending') {
    lines.push(`Date ID pending review for ${user.birthDate || '—'}.`);
  } else if (dateStatus === 'rejected') {
    const note = user.birthVerificationNote ? ` Note: ${user.birthVerificationNote}` : '';
    lines.push(`Date verification was not approved.${note}`);
  } else {
    lines.push('Verification is optional. Upload an ID only if you want the public Verified badge.');
  }

  if (timeStatus === 'verified') {
    lines.push(
      `Time Verified: ${user.birthTime || '—'} (4th animal / golden badge).${
        user.birthTimeVerifiedAt
          ? ` Confirmed ${new Date(user.birthTimeVerifiedAt * 1000).toLocaleDateString()}.`
          : ''
      }`
    );
  } else if (timeStatus === 'pending') {
    lines.push(`Time proof pending review for ${user.birthTime || '—'}.`);
  } else if (timeStatus === 'rejected') {
    const note = user.birthTimeVerificationNote ? ` Note: ${user.birthTimeVerificationNote}` : '';
    lines.push(`Time verification was not approved.${note}`);
  } else if (dateStatus === 'verified') {
    lines.push(
      'Optional: submit a birth certificate or sworn declaration to earn the golden Time Verified badge.'
    );
  }

  return lines.join(' ');
}

function setFormLocked(form, locked, submitEl, lockedLabel, openLabel) {
  if (!form) return;
  form.querySelectorAll('input, textarea, button').forEach((el) => {
    el.disabled = locked;
  });
  if (submitEl) {
    submitEl.disabled = locked;
    submitEl.textContent = locked ? lockedLabel : openLabel;
  }
}

let listingPreviewBase = null;

function syncListingPreviewFromForm() {
  const previewEl = document.getElementById('account-listing-preview');
  if (!previewEl || !listingPreviewBase) return;
  const intro = document.getElementById('listing-intro');
  const contactEmail = document.getElementById('listing-contact-email');
  previewEl.hidden = false;
  previewEl.innerHTML = listingPreviewHtml({
    ...listingPreviewBase,
    intro: intro?.value || '',
    contactEmail: contactEmail?.value.trim() || '',
  });
}

function renderListingPanel(user) {
  const statusEl = document.getElementById('account-listing-status');
  const emptyEl = document.getElementById('account-listing-empty');
  const previewEl = document.getElementById('account-listing-preview');
  const form = document.getElementById('account-listing-form');
  const intro = document.getElementById('listing-intro');
  const contactEmail = document.getElementById('listing-contact-email');
  const listing = user?.listing;

  if (statusEl) statusEl.textContent = listingStatusText(user);

  if (!listing) {
    listingPreviewBase = null;
    if (emptyEl) emptyEl.hidden = false;
    if (previewEl) {
      previewEl.hidden = true;
      previewEl.innerHTML = '';
    }
    if (form) form.hidden = true;
    return;
  }

  listingPreviewBase = {
    ...listing,
    displayName: user.username || listing.displayName || user.displayName || '',
  };
  if (emptyEl) emptyEl.hidden = true;
  if (form) form.hidden = false;
  if (intro) intro.value = listing.intro || '';
  if (contactEmail) contactEmail.value = listing.contactEmail || '';
  syncListingPreviewFromForm();
}

function renderSignedIn(user) {
  const signedOut = document.getElementById('account-signed-out');
  const signedIn = document.getElementById('account-signed-in');
  const status = document.getElementById('account-status');
  const birthStatus = document.getElementById('account-birth-status');
  const username = document.getElementById('profile-username');
  const email = document.getElementById('profile-email');
  const birthDate = document.getElementById('birth-date');
  const birthTime = document.getElementById('birth-time');
  const profileBirthDate = document.getElementById('profile-birth-date');
  const profileBirthTime = document.getElementById('profile-birth-time');
  const profileBirthCity = document.getElementById('profile-birth-city');
  const profileBirthName = document.getElementById('profile-birth-name');
  const birthDetailsForm = document.getElementById('account-birth-details-form');
  const birthDetailsSubmit = document.getElementById('account-birth-details-submit');
  const birthForm = document.getElementById('account-birth-form');
  const birthTimeForm = document.getElementById('account-birth-time-form');
  const birthSubmit = document.getElementById('account-birth-submit');
  const birthTimeSubmit = document.getElementById('account-birth-time-submit');
  const phoneCode = document.getElementById('profile-phone-code');
  const phoneLocal = document.getElementById('profile-phone-local');

  if (signedOut) signedOut.hidden = true;
  if (signedIn) signedIn.hidden = false;
  if (status) {
    const contact = [user.email, user.phone].filter(Boolean).join(' · ');
    status.innerHTML = `<strong>@${user.username}</strong>${contact ? `<br>${contact}` : ''}<br>${listingStatusText(user)}<br>${birthBadge(user)}`;
  }
  if (birthStatus) birthStatus.textContent = birthStatusCopy(user);
  if (username) username.value = user.username;
  if (email) email.value = user.email || '';
  if (phoneCode && phoneLocal) {
    const parts = splitPhone(user.phone || '');
    fillDialCodeSelect(phoneCode, parts.code);
    phoneLocal.value = parts.local;
  }
  if (profileBirthName) profileBirthName.value = user.birthName || '';
  if (profileBirthDate) profileBirthDate.value = user.birthDate || '';
  if (profileBirthTime) profileBirthTime.value = user.birthTime || '';
  if (profileBirthCity) profileBirthCity.value = user.birthPlace || '';
  if (birthDate && user.birthDate) birthDate.value = user.birthDate;
  if (birthTime) birthTime.value = user.birthTime || '';

  renderListingPanel(user);

  const claimedLocked =
    user.birthVerificationStatus === 'pending' ||
    user.birthVerificationStatus === 'verified' ||
    user.birthTimeVerificationStatus === 'pending' ||
    user.birthTimeVerificationStatus === 'verified';
  setFormLocked(
    birthDetailsForm,
    claimedLocked,
    birthDetailsSubmit,
    claimedLocked ? 'Locked while verified / pending' : 'Save birth details',
    'Save birth details'
  );

  const dateLocked =
    user.birthVerificationStatus === 'pending' || user.birthVerificationStatus === 'verified';
  setFormLocked(
    birthForm,
    dateLocked,
    birthSubmit,
    user.birthVerificationStatus === 'verified' ? 'Verified' : 'Pending review',
    'Submit for Verified review'
  );

  const timeLocked =
    user.birthVerificationStatus !== 'verified' ||
    user.birthTimeVerificationStatus === 'pending' ||
    user.birthTimeVerificationStatus === 'verified';
  let timeLabel = 'Submit for Time Verified review';
  if (user.birthTimeVerificationStatus === 'verified') timeLabel = 'Time Verified';
  else if (user.birthTimeVerificationStatus === 'pending') timeLabel = 'Pending review';
  else if (user.birthVerificationStatus !== 'verified') timeLabel = 'Get Verified (date) first';
  setFormLocked(birthTimeForm, timeLocked, birthTimeSubmit, timeLabel, timeLabel);
  if (birthTimeSubmit && !timeLocked) {
    birthTimeSubmit.textContent = 'Submit for Time Verified review';
  }
}

function setAccountMode(mode) {
  if (typeof window.__totemSetAccountMode === 'function') {
    window.__totemSetAccountMode(mode);
  }
  const next = mode === 'register' ? 'register' : 'login';
  const focusId = next === 'register' ? 'register-username' : 'login-identifier';
  const focusEl = document.getElementById(focusId);
  if (focusEl && document.activeElement?.closest?.('#account-signed-out')) {
    focusEl.focus();
  }
}

function preferredSignedOutMode() {
  return location.hash === '#register' ? 'register' : 'login';
}

function resetTokenFromLocation() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash.startsWith('reset=')) return '';
  return decodeURIComponent(hash.slice('reset='.length));
}

function showResetPanel() {
  const token = resetTokenFromLocation();
  const reset = document.getElementById('account-reset');
  const signedOut = document.getElementById('account-signed-out');
  const signedIn = document.getElementById('account-signed-in');
  if (!token || !reset) return false;
  reset.hidden = false;
  if (signedOut) signedOut.hidden = true;
  if (signedIn) signedIn.hidden = true;
  reset.dataset.token = token;
  return true;
}

function renderSignedOut() {
  if (showResetPanel()) return;
  const signedOut = document.getElementById('account-signed-out');
  const signedIn = document.getElementById('account-signed-in');
  const reset = document.getElementById('account-reset');
  if (signedOut) signedOut.hidden = false;
  if (signedIn) signedIn.hidden = true;
  if (reset) reset.hidden = true;
  setAccountMode(preferredSignedOutMode());
}

async function refresh() {
  try {
    const user = await fetchCurrentUser();
    if (user) renderSignedIn(user);
    else renderSignedOut();
  } catch (error) {
    renderSignedOut();
    console.error(error);
  }
}

async function setupAccountCityLookups(registerForm, birthDetailsForm) {
  try {
    const { initCityLookup } = await import('./birth-form.js');
    if (registerForm) {
      initCityLookup(registerForm, {
        cityInput: '#register-birth-city',
        suggestions: '#register-birth-city-suggestions',
      });
    }
    if (birthDetailsForm) {
      initCityLookup(birthDetailsForm, {
        cityInput: '#profile-birth-city',
        suggestions: '#profile-birth-city-suggestions',
      });
    }
  } catch (error) {
    console.warn('Birth city autocomplete unavailable.', error);
  }
}

function initAccountPage() {
  // Show the sign-in UI immediately so a later import/network failure cannot leave a blank page.
  renderSignedOut();

  const loginForm = document.getElementById('account-login-form');
  const registerForm = document.getElementById('account-register-form');
  const profileForm = document.getElementById('account-profile-form');
  const listingForm = document.getElementById('account-listing-form');
  const listingRemove = document.getElementById('account-listing-remove');
  const listingIntro = document.getElementById('listing-intro');
  const listingContactEmail = document.getElementById('listing-contact-email');
  const birthDetailsForm = document.getElementById('account-birth-details-form');
  const birthForm = document.getElementById('account-birth-form');
  const birthTimeForm = document.getElementById('account-birth-time-form');
  const logoutButton = document.getElementById('account-logout');
  const loginMessage = document.getElementById('account-login-message');
  const registerMessage = document.getElementById('account-register-message');
  const profileMessage = document.getElementById('account-profile-message');
  const listingMessage = document.getElementById('account-listing-message');
  const birthDetailsMessage = document.getElementById('account-birth-details-message');
  const birthMessage = document.getElementById('account-birth-message');
  const birthTimeMessage = document.getElementById('account-birth-time-message');
  window.addEventListener('hashchange', () => {
    if (!document.getElementById('account-signed-out')?.hidden) {
      setAccountMode(preferredSignedOutMode());
    }
  });

  const forgotToggle = document.getElementById('account-forgot-toggle');
  const forgotForm = document.getElementById('account-forgot-form');
  const forgotMessage = document.getElementById('account-forgot-message');
  const resetForm = document.getElementById('account-reset-form');
  const resetMessage = document.getElementById('account-reset-message');

  forgotToggle?.addEventListener('click', () => {
    if (!forgotForm) return;
    forgotForm.hidden = !forgotForm.hidden;
  });

  forgotForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(forgotMessage);
    const identifier = String(new FormData(forgotForm).get('identifier') || '').trim();
    if (!identifier) {
      showMessage(forgotMessage, 'Enter the email or phone on your account.', 'error');
      return;
    }
    try {
      const data = await requestPasswordReset(identifier);
      showMessage(forgotMessage, data.message || 'If that account has an email, we sent a reset link.', 'success');
    } catch (error) {
      showMessage(forgotMessage, error.message || 'Could not send a reset link.', 'error');
    }
  });

  resetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(resetMessage);
    const password = String(new FormData(resetForm).get('password') || '');
    const password2 = String(new FormData(resetForm).get('password2') || '');
    if (password.length < 6) {
      showMessage(resetMessage, 'Password must be at least 6 characters. Capital letters, lowercase letters, and numbers are all allowed.', 'error');
      return;
    }
    if (password !== password2) {
      showMessage(resetMessage, 'Passwords do not match.', 'error');
      return;
    }
    try {
      const data = await resetPassword({
        token: document.getElementById('account-reset')?.dataset.token || resetTokenFromLocation(),
        password,
      });
      showMessage(resetMessage, data.message || 'Password updated. You can sign in.', 'success');
      history.replaceState(null, '', 'account.html');
    } catch (error) {
      showMessage(resetMessage, error.message || 'Could not reset your password.', 'error');
    }
  });

  if (resetTokenFromLocation()) showResetPanel();

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(loginMessage);
    const form = new FormData(loginForm);
    try {
      const data = await loginAccount({
        identifier: String(form.get('identifier') || ''),
        password: String(form.get('password') || ''),
        staySignedIn: document.getElementById('login-stay')?.checked !== false,
      });
      renderSignedIn(data.user);
      showMessage(loginMessage, 'Signed in.', 'success');
    } catch (error) {
      showMessage(loginMessage, error.message || 'Could not sign in.', 'error');
    }
  });

  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(registerMessage);
    const form = new FormData(registerForm);
    const password = String(form.get('password') || '');
    const password2 = String(form.get('password2') || '');
    const email = String(form.get('email') || '').trim();
    const phone = combinePhone(form.get('phoneCountry'), form.get('phoneLocal'));
    const username = String(form.get('username') || '').trim();
    if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
      showMessage(
        registerMessage,
        'Usernames can use capital letters, lowercase letters, numbers, and underscores (3–32 characters). Spaces and other symbols are not part of a username. Your password is separate and can use capitals and numbers freely.',
        'error'
      );
      return;
    }
    if (!email && !phone) {
      showMessage(registerMessage, 'Enter an email address or phone number.', 'error');
      return;
    }
    if (password.length < 6) {
      showMessage(registerMessage, 'Password must be at least 6 characters.', 'error');
      return;
    }
    if (password !== password2) {
      showMessage(registerMessage, 'Passwords do not match.', 'error');
      return;
    }
    try {
      const data = await registerAccount({
        email,
        phone,
        password,
        username,
        birthDate: String(form.get('birthDate') || ''),
        birthTime: String(form.get('birthTime') || ''),
        birthPlace: String(form.get('birthPlace') || '').trim(),
        birthName: String(form.get('birthName') || '').trim(),
      });
      renderSignedIn(data.user);
      showMessage(registerMessage, 'Account created.', 'success');
    } catch (error) {
      showMessage(registerMessage, error.message || 'Could not create account.', 'error');
    }
  });

  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(profileMessage);
    const form = new FormData(profileForm);
    try {
      const data = await updateAccount({
        email: String(form.get('email') || ''),
        phone: combinePhone(form.get('phoneCountry'), form.get('phoneLocal')),
      });
      renderSignedIn(data.user);
      showMessage(profileMessage, 'Profile saved.', 'success');
    } catch (error) {
      showMessage(profileMessage, error.message || 'Could not save profile.', 'error');
    }
  });

  listingForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(listingMessage);
    const form = new FormData(listingForm);
    try {
      const data = await updateDirectoryListing({
        intro: String(form.get('intro') || ''),
        contactEmail: String(form.get('contactEmail') || ''),
      });
      renderSignedIn(data.user);
      showMessage(listingMessage, data.message || 'Directory Listing saved.', 'success');
    } catch (error) {
      showMessage(listingMessage, error.message || 'Could not save listing.', 'error');
    }
  });

  listingRemove?.addEventListener('click', async () => {
    hideMessage(listingMessage);
    if (!window.confirm('Remove your listing from the public directory?')) return;
    try {
      await removeDirectoryListing();
      const user = await fetchCurrentUser();
      if (user) renderSignedIn(user);
      else renderSignedOut();
      showMessage(listingMessage, 'Your listing was removed.', 'success');
    } catch (error) {
      showMessage(listingMessage, error.message || 'Could not remove listing.', 'error');
    }
  });

  [listingIntro, listingContactEmail].forEach((el) => {
    el?.addEventListener('input', syncListingPreviewFromForm);
  });

  birthDetailsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(birthDetailsMessage);
    const form = new FormData(birthDetailsForm);
    try {
      const data = await saveBirthDetails({
        birthDate: String(form.get('birthDate') || ''),
        birthTime: String(form.get('birthTime') || ''),
        birthPlace: String(form.get('birthPlace') || ''),
        birthName: String(form.get('birthName') || '').trim(),
      });
      renderSignedIn(data.user);
      showMessage(birthDetailsMessage, data.message || 'Birth details saved.', 'success');
    } catch (error) {
      showMessage(birthDetailsMessage, error.message || 'Could not save birth details.', 'error');
    }
  });

  birthForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(birthMessage);
    const form = new FormData(birthForm);
    const file = form.get('idDocument');
    if (!(file instanceof File) || !file.size) {
      showMessage(birthMessage, 'Choose a photo of your ID.', 'error');
      return;
    }
    try {
      const data = await submitBirthVerification({
        birthDate: String(form.get('birthDate') || ''),
        idDocument: file,
        note: String(form.get('note') || ''),
      });
      renderSignedIn(data.user);
      showMessage(birthMessage, data.message || 'Submitted for review.', 'success');
      birthForm.reset();
    } catch (error) {
      showMessage(birthMessage, error.message || 'Could not submit verification.', 'error');
    }
  });

  birthTimeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(birthTimeMessage);
    const form = new FormData(birthTimeForm);
    const file = form.get('timeDocument');
    if (!(file instanceof File) || !file.size) {
      showMessage(birthTimeMessage, 'Choose a birth certificate or sworn declaration file.', 'error');
      return;
    }
    try {
      const data = await submitBirthTimeVerification({
        birthTime: String(form.get('birthTime') || ''),
        timeDocument: file,
        note: String(form.get('note') || ''),
      });
      renderSignedIn(data.user);
      showMessage(birthTimeMessage, data.message || 'Submitted for review.', 'success');
      birthTimeForm.reset();
    } catch (error) {
      showMessage(birthTimeMessage, error.message || 'Could not submit time verification.', 'error');
    }
  });

  logoutButton?.addEventListener('click', async () => {
    await logoutAccount();
    renderSignedOut();
  });

  fillDialCodeSelect(document.getElementById('register-phone-code'), '1');
  fillDialCodeSelect(document.getElementById('profile-phone-code'), '1');

  void setupAccountCityLookups(registerForm, birthDetailsForm);
  void refresh();
}

document.addEventListener('DOMContentLoaded', initAccountPage);
