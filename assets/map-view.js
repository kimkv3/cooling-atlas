/* Progressive enhancement: the HTML default is 3D; original 2D links always work. */
(() => {
  "use strict";
  const key = "cooling-atlas-map-view";
  const buttons = [...document.querySelectorAll("[data-map-mode]")];
  const panels = [...document.querySelectorAll("[data-map-panel]")];
  const apply = (mode) => {
    const selected = mode === "2d" ? "2d" : "3d";
    panels.forEach((panel) => { panel.hidden = panel.dataset.mapPanel !== selected; });
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mapMode === selected));
    });
  };
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Storage may be blocked. */ }
  apply(saved);
  buttons.forEach((button) => button.addEventListener("click", () => {
    apply(button.dataset.mapMode);
    try { localStorage.setItem(key, button.dataset.mapMode); } catch { /* Still usable. */ }
  }));
  document.querySelectorAll(".map-toggle").forEach((group) => { group.hidden = false; });
  window.addEventListener("storage", (event) => { if (event.key === key) apply(event.newValue); });
})();
