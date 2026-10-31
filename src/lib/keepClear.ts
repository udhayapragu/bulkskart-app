/** Rough height of the expanded popup, used to predict whether it would cover something. */
const POPUP_HEIGHT = 340;

/**
 * True when the expanded popup, docked at the bottom-left, would sit on top of an element that asked
 * to be kept clear (data-keep-clear), such as the primary buttons of the homepage hero.
 */
export function wouldCoverKeepClear(onHome: boolean): boolean {
  if (typeof window === 'undefined') return false;
  const narrow = window.innerWidth < 640;
  const left = narrow ? 12 : 16;
  const right = left + Math.min(window.innerWidth - 24, 380);
  const bottom = window.innerHeight - (narrow ? (onHome ? 16 : 96) : 24);
  const top = bottom - POPUP_HEIGHT;
  return Array.from(document.querySelectorAll('[data-keep-clear]')).some((element) => {
    const box = element.getBoundingClientRect();
    return box.bottom > top && box.top < bottom && box.right > left && box.left < right;
  });
}
