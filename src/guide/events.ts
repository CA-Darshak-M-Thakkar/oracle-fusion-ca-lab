export function emitGuide(event: string) {
  window.dispatchEvent(new CustomEvent('fusion-guide', { detail: event }));
}
