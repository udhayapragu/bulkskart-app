/** Resolves true when this browser can load the image, which is what a buyer's browser will have to do too. */
export function probeImage(url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    let timer: number | undefined;
    const finish = (loaded: boolean) => {
      if (timer !== undefined) window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(loaded);
    };
    timer = window.setTimeout(() => finish(false), timeoutMs);
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    image.src = url;
  });
}

/**
 * Probes each distinct link once, a few at a time, and reports progress as it goes.
 * Stops starting new probes as soon as `shouldStop` returns true; the map then holds only what finished.
 */
export async function probeAll(
  urls: string[],
  probe: (url: string) => Promise<boolean> = probeImage,
  concurrency = 8,
  onProgress?: (done: number, total: number) => void,
  shouldStop?: () => boolean,
): Promise<Map<string, boolean>> {
  const unique = [...new Set(urls)];
  const results = new Map<string, boolean>();
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < unique.length && !shouldStop?.()) {
      const url = unique[next];
      next += 1;
      results.set(url, await probe(url).catch(() => false));
      done += 1;
      onProgress?.(done, unique.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
  return results;
}
