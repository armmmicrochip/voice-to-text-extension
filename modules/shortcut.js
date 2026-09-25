// Toggle-recording shortcut: Ctrl+Shift+Space on Windows/Linux, Cmd+Shift+Space on macOS.
// Avoids Ctrl/Cmd+Shift+V (paste as plain text) and letter keys, which produce
// different characters under Option on macOS and vary by keyboard layout.

const platform = navigator.userAgentData?.platform || navigator.platform || "";
export const IS_MAC = /mac|iphone|ipad/i.test(platform);

export const SHORTCUT_LABEL = `${IS_MAC ? "Cmd" : "Ctrl"}+Shift+Space`;

export function isToggleShortcut(e) {
  const primary = IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  return primary && e.shiftKey && !e.altKey && e.code === "Space" && !e.repeat;
}
