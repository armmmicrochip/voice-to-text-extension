/**
 * Voice Input Assistant — content script loader
 *
 * The content_scripts manifest key has no "type": "module" option, so this
 * file must stay a classic script (no static import/export). It loads the
 * real ES-module entry point with dynamic import(), which classic scripts
 * are allowed to use. The modules must be listed in web_accessible_resources.
 */
(async () => {
  try {
    await import(chrome.runtime.getURL("modules/main.js"));
  } catch (err) {
    console.error("[VoiceInput] Failed to load modules:", err);
  }
})();
