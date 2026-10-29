/**
 * Wire [data-stripe-pay] anchors from window.TOTEM_STRIPE.paymentLink.
 * Owns button label (do not put data-i18n on these — i18n would overwrite).
 */
(function () {
  function applyStripeLinks() {
    const cfg = window.TOTEM_STRIPE || {};
    const link = typeof cfg.paymentLink === "string" ? cfg.paymentLink.trim() : "";
    const label = cfg.label || "Pay $200";
    const nodes = document.querySelectorAll("[data-stripe-pay]");

    nodes.forEach((el) => {
      if (!link || !/^https:\/\/buy\.stripe\.com\//i.test(link)) {
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
        el.removeAttribute("href");
        return;
      }

      el.hidden = false;
      el.removeAttribute("aria-hidden");
      el.href = link;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
      el.classList.add("btn-stripe");
      el.setAttribute("aria-label", label + " with Stripe");
      if (el.dataset.stripeLabel !== "keep") {
        el.textContent = label;
      }
    });

    document.querySelectorAll("[data-stripe-ready]").forEach((el) => {
      el.hidden = !link;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyStripeLinks);
  } else {
    applyStripeLinks();
  }

  // Re-apply after i18n (module) finishes and on language changes.
  window.addEventListener("load", applyStripeLinks);
  window.addEventListener("totem:localechange", applyStripeLinks);
})();
