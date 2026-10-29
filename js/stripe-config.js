/**
 * Stripe Payment Link for Totem Astrology readings ($200 · 75 min).
 *
 * 1. In Stripe Dashboard → Payment Links → create a $200 link
 *    (product name e.g. "Totem Astrology Reading — 75 minutes")
 * 2. Paste the full URL below (https://buy.stripe.com/...)
 * 3. Upload this file with services.html
 *
 * Leave empty to hide pay buttons until the link is ready.
 */
window.TOTEM_STRIPE = {
  /** @type {string} */
  paymentLink: "https://buy.stripe.com/cNieVd46N618dlH9Mi9R600",
  label: "Pay $200",
};
