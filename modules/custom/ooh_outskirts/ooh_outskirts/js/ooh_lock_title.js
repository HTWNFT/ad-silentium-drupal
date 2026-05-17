(function (Drupal, once) {
  "use strict";

  const BANNED = [
    "UNDERBOARD",
    "UNDERBOARD ALLEY",
    "DATA BUNKER",
    "Cold corridors",
    "Buried systems",
    "Controlled glow"
  ];

  function forceTitleAndStrip() {
    // Force title text to AD SILENTIUM
    const titleEl =
      document.querySelector(".ooh-game-title") ||
      document.querySelector(".ooh-hero-title") ||
      document.querySelector(".ooh-title") ||
      document.querySelector("h1");

    if (titleEl) titleEl.textContent = "AD SILENTIUM";

    // Remove any element whose *visible text* contains banned strings,
    // except buttons/links and the main title itself.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    const kill = [];

    while (walker.nextNode()) {
      const el = walker.currentNode;

      // Skip interactive controls.
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "button" || tag === "a" || tag === "input" || tag === "textarea") continue;

      // Skip the title element itself
      if (titleEl && (el === titleEl || el.contains(titleEl))) continue;

      const txt = (el.textContent || "").trim();
      if (!txt) continue;

      const hit = BANNED.some((w) => txt.toUpperCase().includes(w.toUpperCase()));
      if (hit) kill.push(el);
    }

    kill.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
  }

  Drupal.behaviors.oohLockTitle = {
    attach(context) {
      once("oohLockTitle", "body", context).forEach(() => {
        forceTitleAndStrip();

        // Keep stomping late DOM writes from carousel/Drupal behaviors.
        const obs = new MutationObserver(forceTitleAndStrip);
        obs.observe(document.body, { subtree: true, childList: true, characterData: true });

        let i = 0;
        const t = setInterval(() => {
          forceTitleAndStrip();
          i++;
          if (i > 40) clearInterval(t); // ~8s
        }, 200);
      });
    },
  };
})(Drupal, once);
