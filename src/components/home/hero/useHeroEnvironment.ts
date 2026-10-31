import { type RefObject, useEffect, useState, useSyncExternalStore } from 'react';

function subscribeToQuery(query: string, onChange: () => void) {
  const list = window.matchMedia(query);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

/** Tracks a CSS media query. Returns `fallback` during server rendering. */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => subscribeToQuery(query, onChange),
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Marks the hero as inactive (data-active="false") while it is scrolled out of view or the tab is in
 * the background. The stylesheet pauses every animation while it is inactive.
 */
export function useHeroActivity(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    let inView = true;
    let tabVisible = document.visibilityState !== 'hidden';
    const apply = () => {
      root.dataset.active = inView && tabVisible ? 'true' : 'false';
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      apply();
    });
    observer.observe(root);
    const onVisibility = () => {
      tabVisible = document.visibilityState !== 'hidden';
      apply();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref]);
}

/**
 * Moves every element marked with data-depth: a little with the pointer on desktop and a little
 * with the page scroll everywhere. Deeper layers move more. Uses one animation frame per change.
 */
export function useHeroParallax(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root) return undefined;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-depth]')).map((element) => ({
      element,
      depth: Number(element.dataset.depth) || 0,
    }));
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scroll = 0;
    let frame = 0;

    const render = () => {
      frame = 0;
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;
      for (const { element, depth } of layers) {
        const x = -currentX * depth * 22;
        const y = -currentY * depth * 14 + scroll * depth * 0.16;
        element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
      const settling = Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002;
      if (settling) frame = requestAnimationFrame(render);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onPointer = (event: PointerEvent) => {
      if (root.dataset.active === 'false') return;
      const box = root.getBoundingClientRect();
      targetX = ((event.clientX - box.left) / box.width - 0.5) * 2;
      targetY = ((event.clientY - box.top) / box.height - 0.5) * 2;
      schedule();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };
    const onScroll = () => {
      if (root.dataset.active === 'false') return;
      scroll = Math.min(Math.max(window.scrollY, 0), root.offsetHeight);
      schedule();
    };

    if (finePointer) {
      root.addEventListener('pointermove', onPointer, { passive: true });
      root.addEventListener('pointerleave', onLeave, { passive: true });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', onPointer);
      root.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      for (const { element } of layers) element.style.transform = '';
    };
  }, [ref, enabled]);
}

/** Runs `task` once the browser is idle (or shortly after first paint where that API is missing). */
export function useAfterFirstPaint(delayMs = 0): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const win = window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let timer = 0;
    let idle = 0;
    const start = () => {
      if (win.requestIdleCallback) idle = win.requestIdleCallback(() => setReady(true), { timeout: 1200 });
      else setReady(true);
    };
    timer = window.setTimeout(start, delayMs);
    return () => {
      window.clearTimeout(timer);
      if (idle && win.cancelIdleCallback) win.cancelIdleCallback(idle);
    };
  }, [delayMs]);
  return ready;
}

/** Becomes true right after the browser has painted one frame, so heavy decoration never delays the first paint. */
export function useAfterPaint(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, []);
  return ready;
}
