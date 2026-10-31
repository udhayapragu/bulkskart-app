/**
 * One image, one place. The landing page asks this registry before it shows a photo, and the
 * registry refuses any image that is already shown somewhere else on the page. The caller then
 * shows a neutral placeholder instead of repeating a picture.
 *
 * Claims are held by an "owner" string such as "suppliers:<id>:photo". Claiming the same image
 * again with the same owner is allowed, so re-rendering never changes the outcome.
 */

/** Parameters that only change how an image is delivered, never which image it is. */
const PRESENTATION_PARAMS = new Set([
  'w', 'h', 'q', 'fit', 'fm', 'auto', 'crop', 'dpr', 'width', 'height', 'quality', 'format',
  't', 'v', 'cb', 'cache', 'ixlib', 'ixid', 'utm_source', 'utm_medium', 'utm_campaign',
]);

/** Stable identity of an image: the same file served at another size or with a cache-buster is the same image. */
export function imageKey(url: string): string {
  try {
    const parsed = new URL(url);
    const params = [...parsed.searchParams.entries()]
      .filter(([name]) => !PRESENTATION_PARAMS.has(name.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${name}=${value}`)
      .join('&');
    const path = decodeURIComponent(parsed.pathname).replace(/\/+$/, '');
    return `${parsed.hostname.toLowerCase()}${path}${params ? `?${params}` : ''}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

export interface RefusedClaim {
  url: string;
  owner: string;
  heldBy: string;
}

export interface ImageRegistry {
  /** True when `owner` holds `url` after the call. False for an empty url or one held by someone else. */
  claim(owner: string, url: string | null | undefined): boolean;
  /** Claims the first candidate nobody else holds and returns it, or null when none is free. */
  claimFirst(owner: string, candidates: ReadonlyArray<string | null | undefined>): string | null;
  /** Drops every claim whose owner starts with `prefix`, before a section recomputes its images. */
  releaseGroup(prefix: string): void;
  ownerOf(url: string): string | undefined;
  /** Every claim that was refused because the image was already in use. For audits. */
  refused(): RefusedClaim[];
  size(): number;
  clear(): void;
}

export function createImageRegistry(): ImageRegistry {
  const holders = new Map<string, string>();
  const refusals: RefusedClaim[] = [];

  const registry: ImageRegistry = {
    claim(owner, url) {
      if (!url || !url.trim()) return false;
      const key = imageKey(url);
      const heldBy = holders.get(key);
      if (heldBy === undefined) {
        holders.set(key, owner);
        return true;
      }
      if (heldBy === owner) return true;
      refusals.push({ url, owner, heldBy });
      return false;
    },
    claimFirst(owner, candidates) {
      for (const candidate of candidates) {
        if (candidate && registry.claim(owner, candidate)) return candidate;
      }
      return null;
    },
    releaseGroup(prefix) {
      for (const [key, owner] of holders) {
        if (owner.startsWith(prefix)) holders.delete(key);
      }
    },
    ownerOf(url) {
      return holders.get(imageKey(url));
    },
    refused() {
      return [...refusals];
    },
    size() {
      return holders.size;
    },
    clear() {
      holders.clear();
      refusals.length = 0;
    },
  };
  return registry;
}

/** The registry shared by every section of the landing page. */
export const landingImages: ImageRegistry = createImageRegistry();
