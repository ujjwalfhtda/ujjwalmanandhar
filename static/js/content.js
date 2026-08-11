/* Public site content binding — applies admin-edited text onto the page.
   Fetches /api/public/content and replaces the mapped nodes.
   Safe no-op if the API is unavailable. */
(function () {
  "use strict";

  const SELECTORS = {
    "hero.eyebrow": ".hero .eyebrow",
    "hero.title": "#hero-title",
    "hero.lede": ".hero-lede",
    "about.title": "#about-title",
    "about.subtitle": "#about .section-lede",
    "about.body": ".about-bio > p",
    "contact.title": "#cta-title",
    "cta.subtitle": ".cta-lede",
    "cta.reply": ".cta-trust strong",
    "footer.copyright": ".footer-base-inner > span",
    "footer.tagline": ".footer-brand p",
  };

  fetch("/api/public/content", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((content) => {
      Object.entries(SELECTORS).forEach(([key, selector]) => {
        const value = key.split(".").reduce((o, k) => (o && o[k]) || "", content);
        if (!value) return;
        const node = document.querySelector(selector);
        if (!node) return;
        if (key === "about.body") {
          // preserve the first paragraph only
          node.textContent = value;
        } else {
          node.innerHTML = value;
        }
      });
    })
    .catch(() => {
      // API unavailable — leave the static text as-is
    });
})();