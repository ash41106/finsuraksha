// Applies saved display preferences before first paint (no flash of the wrong theme).
(function () {
  try {
    var p = JSON.parse(localStorage.getItem("fs_prefs") || "{}");
    var root = document.documentElement;
    // Light is the default look; "auto" follows the device setting.
    if (p.theme !== "auto") root.setAttribute("data-theme", p.theme === "dark" ? "dark" : "light");
    if (p.font === "lg" || p.font === "xl") root.setAttribute("data-font", p.font);
    if (p.contrast === "high") root.setAttribute("data-contrast", "high");
    if (p.lang === "hi") root.setAttribute("lang", "hi");
  } catch (e) {
    /* storage unavailable - defaults apply */
  }
})();
