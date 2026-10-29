(function () {
  const ABOUT_GUIDE_DETAILS = {
    spirit: {
      title: 'Year · Spirit',
      guide: 'Spiritual Guide',
      summary: 'This animal speaks to us in the language of intuition.',
      detail:
        'The Spiritual Guide animal has the highest perspective on your life, your guiding light that sees the big picture of meaning, purpose, and inner direction. You should listen to this animal most carefully when it comes to big life changes and decisions that have long-lasting consequences. The Spirit Animal will steer you true even when your other three animals can\'t see through the fog of the present moment — this animal is above it all, and can guide you out of the maze even when it all seems hopeless.',
    },
    mind: {
      title: 'Month · Mind',
      guide: 'Mental Guide',
      summary: 'This animal speaks in the language of our thoughts.',
      detailHtml:
        'This is the animal that most people are familiar with already, as it is the one who usually does most of the talking. As your Mental Guide, it shapes how you think, learn, and make sense of the world, but it also tends to be the face that others see first when they meet you. This animal can compete with the Spirit Animal in many people for guidance on how to make big life decisions, and I personally have seen many people adrift, confused, and hurt, and all that\'s happening is that they\'re letting their Mind Animal run the show rather than their Spirit Animal. The Spirit Animal is meant to help us see <strong>where</strong> we\'re going, the Mind Animal is only meant to help us figure out how exactly to get there. When we expect it to set our course rather than only do the work of charting it out for us, we can get into big trouble and find ourselves living a life that doesn\'t feel like ours at all. Listen to the Mind Animal\'s guidance on day to day matters, but trust in the Spirit Animal\'s guidance when it comes to major life moves.',
    },
    heart: {
      title: 'Day · Heart',
      guide: 'Emotional Guide',
      summary: 'This animal speaks to us in the language of our emotions.',
      detail:
        'This is the animal that tugs our heart strings, stirs our passions, helps us in the realm of feelings and empathic connection with others. Anywhere that emotions hold sway, this animal is there, guiding our reactions, helping us with its unique skill set to navigate the world of the people we care about. This is the animal who has the clearest say in matters of the heart, plain and simple. If things are aligned nicely here, it\'s much easier to make them work on the other three levels.',
    },
    body: {
      title: 'Hour · Body',
      guide: 'Physical Guide',
      summary: 'This animal speaks to us through the language of instinct.',
      detail:
        'This animal guides our body through the physical world, helping us navigate the 3D space around us with its own unique skill set and repertoire of innate wisdom on how to handle things. It charges up our instincts, giving us the benefit of that animal\'s know-how in the domain covered by everything we can touch with our arms and our legs. If you\'re curious to know how each specific animal plays out in the realm of the Body, or any of the other three levels, go ahead and book a reading! I\'ve been studying people for years, this has been a passion of mine for a very long time that I\'m so grateful to be able to share with the world. It\'s also something that I\'m always learning more about with each new person that I meet, because everyone plays their cards a little bit differently, but the underlying similarities are there just waiting to be spotted by the keen eye who\'s searching...',
    },
  };

  let dialogEl = null;
  let lastFocusedEl = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureDialog() {
    if (dialogEl) return dialogEl;

    dialogEl = document.createElement('dialog');
    dialogEl.className = 'totem-modal';
    dialogEl.setAttribute('aria-labelledby', 'about-guide-modal-title');
    dialogEl.innerHTML =
      '<div class="totem-modal__panel">' +
      '<button type="button" class="totem-modal__close" aria-label="Close details">&times;</button>' +
      '<div class="totem-modal__body"></div>' +
      '</div>';

    document.body.appendChild(dialogEl);

    dialogEl.querySelector('.totem-modal__close').addEventListener('click', closeAboutGuideModal);
    dialogEl.addEventListener('click', (event) => {
      if (event.target === dialogEl) closeAboutGuideModal();
    });
    dialogEl.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeAboutGuideModal();
    });

    return dialogEl;
  }

  function openAboutGuideModal(guideId) {
    const detail = ABOUT_GUIDE_DETAILS[guideId];
    if (!detail) return;

    const dialog = ensureDialog();
    lastFocusedEl = document.activeElement;

    dialog.querySelector('.totem-modal__body').innerHTML =
      '<div class="totem-modal__header">' +
      `<h2 id="about-guide-modal-title" class="totem-modal__title">${escapeHtml(detail.title)}</h2>` +
      `<p class="totem-modal__subtitle">${escapeHtml(detail.summary)}</p>` +
      `<p class="totem-modal__guide">${escapeHtml(detail.guide)}</p>` +
      '</div>' +
      `<div class="totem-modal__copy"><p>${detail.detailHtml || escapeHtml(detail.detail)}</p></div>`;

    dialog.showModal();
  }

  function closeAboutGuideModal() {
    if (!dialogEl?.open) return;
    dialogEl.close();
    lastFocusedEl?.focus?.();
    lastFocusedEl = null;
  }

  function initAboutGuideModals() {
    const grid = document.querySelector('.about-guides');
    if (!grid) return;

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('.step--interactive');
      if (!button || !grid.contains(button)) return;
      openAboutGuideModal(button.dataset.guide);
    });
  }

  document.addEventListener('DOMContentLoaded', initAboutGuideModals);
})();
