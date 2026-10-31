import { afterEach, describe, expect, it } from 'vitest';
import { wouldCoverKeepClear } from '@/lib/keepClear';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

function addKeepClear(box: { left: number; right: number; top: number; bottom: number }) {
  const element = document.createElement('div');
  element.setAttribute('data-keep-clear', '');
  element.getBoundingClientRect = () => ({ ...box, x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top, toJSON: () => ({}) });
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('wouldCoverKeepClear', () => {
  it('is false when nothing asked to be kept clear', () => {
    setViewport(1280, 800);
    expect(wouldCoverKeepClear(true)).toBe(false);
  });

  it('is true when the docked popup would sit on a marked element', () => {
    setViewport(1280, 800);
    addKeepClear({ left: 40, right: 500, top: 480, bottom: 560 });
    expect(wouldCoverKeepClear(true)).toBe(true);
  });

  it('is false when the marked element is above the popup', () => {
    setViewport(1280, 800);
    addKeepClear({ left: 40, right: 500, top: 120, bottom: 300 });
    expect(wouldCoverKeepClear(true)).toBe(false);
  });

  it('is false when the marked element is to the right of the popup', () => {
    setViewport(1440, 900);
    addKeepClear({ left: 700, right: 1100, top: 600, bottom: 700 });
    expect(wouldCoverKeepClear(true)).toBe(false);
  });

  it('uses the lower dock on the homepage and the higher one elsewhere on phones', () => {
    setViewport(390, 844);
    addKeepClear({ left: 16, right: 374, top: 760, bottom: 800 });
    expect(wouldCoverKeepClear(true)).toBe(true);
    expect(wouldCoverKeepClear(false)).toBe(false);
  });
});
