import { renderTotemAnimalArt } from './totem-animal-art.js';
import { formatElementAnimalTitle, lookupElementAnimalLore } from './totem-element-lore.js';
import { lookupTotemDetail } from './totem-details.js';
import { THEME_LABELS } from './totem-manifest.js';

let dialogEl = null;
let lastFocusedEl = null;

function formatPolarityLabel(polarity) {
  return polarity === 'yang' ? 'Yang' : 'Yin';
}

function ensureDialog() {
  if (dialogEl) return dialogEl;

  dialogEl = document.createElement('dialog');
  dialogEl.className = 'totem-modal';
  dialogEl.setAttribute('aria-labelledby', 'totem-modal-title');
  dialogEl.innerHTML = `
    <div class="totem-modal__panel">
      <button type="button" class="totem-modal__close" aria-label="Close details">&times;</button>
      <div class="totem-modal__body"></div>
    </div>`;

  document.body.appendChild(dialogEl);

  dialogEl.querySelector('.totem-modal__close').addEventListener('click', closeTotemDetailModal);
  dialogEl.addEventListener('click', (event) => {
    if (event.target === dialogEl) closeTotemDetailModal();
  });
  dialogEl.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTotemDetailModal();
  });

  return dialogEl;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFallbackCopy(animalName, element, polarity, stemName) {
  const polarityLabel = formatPolarityLabel(polarity);
  return `<p>A detailed reading for <strong>${polarityLabel} ${element} ${animalName}</strong> (${stemName}) is coming soon. For a personal interpretation of this guide on your totem pole, <a href="contact.php">book a session</a>.</p>`;
}

function renderElementLore(animalName, element, polarity, stemName) {
  const lore = lookupElementAnimalLore(animalName, element);
  if (!lore?.paragraph) return '';

  const title = formatElementAnimalTitle(animalName, element, stemName);
  return `
    <div class="totem-modal__element-lore">
      <h3 class="totem-modal__element-title">${escapeHtml(title)}</h3>
      <p>${lore.paragraph}</p>
    </div>`;
}

function renderDetailBody(detail, animalName, element, polarity, stemName) {
  const baseCopy = !detail?.paragraphs?.length
    ? renderFallbackCopy(animalName, element, polarity, stemName)
    : detail.paragraphs.map((text) => `<p>${text}</p>`).join('');

  return `${baseCopy}${renderElementLore(animalName, element, polarity, stemName)}`;
}

export function openTotemDetailModal({ guideName, animalName, element, polarity, stemName }) {
  const dialog = ensureDialog();
  const detail = lookupTotemDetail(animalName, element, polarity);
  const polarityLabel = formatPolarityLabel(polarity);
  const themeKey = `${polarity}-${element.toLowerCase()}`;
  const themeLabel = THEME_LABELS[themeKey] ?? `${polarityLabel} ${element}`;
  const title = detail?.title ?? `${animalName} · ${stemName}`;
  const subtitle = detail?.subtitle ?? `${polarityLabel} ${element} · ${themeLabel}`;

  lastFocusedEl = document.activeElement;

  dialog.querySelector('.totem-modal__body').innerHTML = `
    <div class="totem-modal__header">
      <div class="totem-modal__art">${renderTotemAnimalArt(animalName, element)}</div>
      <h2 id="totem-modal-title" class="totem-modal__title">${title}</h2>
      <p class="totem-modal__subtitle">${subtitle}</p>
      <p class="totem-modal__guide">${guideName}</p>
    </div>
    <div class="totem-modal__copy">${renderDetailBody(detail, animalName, element, polarity, stemName)}</div>`;

  dialog.showModal();
}

export function closeTotemDetailModal() {
  if (!dialogEl?.open) return;
  dialogEl.close();
  lastFocusedEl?.focus?.();
  lastFocusedEl = null;
}

export function initTotemDetailModal(container) {
  if (!container) return;

  container.addEventListener('click', (event) => {
    const card = event.target.closest('.bazi-pillar--interactive');
    if (!card || !container.contains(card)) return;

    openTotemDetailModal({
      guideName: card.dataset.guide ?? '',
      animalName: card.dataset.animal ?? '',
      element: card.dataset.element ?? '',
      polarity: card.dataset.polarity ?? '',
      stemName: card.dataset.stem ?? '',
    });
  });
}
