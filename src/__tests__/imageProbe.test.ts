import { describe, expect, it, vi } from 'vitest';
import { probeAll } from '@/lib/imageProbe';

const urls = (count: number) => Array.from({ length: count }, (_, index) => `https://cdn.example-supplier.in/p/${index}.jpg`);

describe('probeAll', () => {
  it('checks each distinct link once and returns an answer for every one', async () => {
    const probe = vi.fn(async (url: string) => !url.endsWith('/1.jpg'));
    const [a, b] = urls(2);
    const results = await probeAll([a, b, a, b, a], probe);

    expect(probe).toHaveBeenCalledTimes(2);
    expect(results.get(a)).toBe(true);
    expect(results.get(b)).toBe(false);
    expect(results.size).toBe(2);
  });

  it('never runs more probes at once than the limit', async () => {
    let running = 0;
    let peak = 0;
    const probe = async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 2));
      running -= 1;
      return true;
    };
    const results = await probeAll(urls(20), probe, 3);

    expect(results.size).toBe(20);
    expect(peak).toBe(3);
  });

  it('treats a probe that throws as a photo that did not load', async () => {
    const [good, bad] = urls(2);
    const results = await probeAll([good, bad], async (url) => {
      if (url === bad) throw new Error('network down');
      return true;
    });

    expect(results.get(good)).toBe(true);
    expect(results.get(bad)).toBe(false);
  });

  it('reports progress up to the number of distinct links', async () => {
    const seen: Array<[number, number]> = [];
    await probeAll([...urls(3), ...urls(3)], async () => true, 2, (done, total) => seen.push([done, total]));

    expect(seen.map(([done]) => done)).toEqual([1, 2, 3]);
    expect(seen.every(([, total]) => total === 3)).toBe(true);
  });

  it('stops starting new probes once told to stop', async () => {
    let stop = false;
    const probe = vi.fn(async () => {
      stop = true;
      return true;
    });
    const results = await probeAll(urls(10), probe, 1, undefined, () => stop);

    expect(probe).toHaveBeenCalledTimes(1);
    expect(results.size).toBe(1);
  });

  it('handles an empty list', async () => {
    expect((await probeAll([], async () => true)).size).toBe(0);
  });
});
