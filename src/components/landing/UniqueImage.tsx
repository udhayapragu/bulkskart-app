import { Building2, Factory, Gavel, ImageOff, Package, Tags, type LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PlaceholderKind = 'factory' | 'product' | 'category' | 'logo' | 'rfq' | 'auction' | 'generic';

const ICONS: Record<PlaceholderKind, LucideIcon> = {
  factory: Factory,
  product: Package,
  category: Tags,
  logo: Building2,
  rfq: Package,
  auction: Gavel,
  generic: ImageOff,
};

/** A plain, neutral tile. It never imitates a photograph or a logo. */
export function ImagePlaceholder({ kind = 'generic', caption = true, label }: { kind?: PlaceholderKind; caption?: boolean; label?: string }) {
  const Icon = ICONS[kind];
  return (
    <div
      role="img"
      aria-label={label ?? 'No photo available'}
      data-placeholder={kind}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(150,170,215,0.12),rgba(12,20,36,0.98))]"
    >
      <Icon className={caption ? 'h-9 w-9 text-slate-500/80' : 'h-6 w-6 text-slate-500/80'} strokeWidth={1.5} aria-hidden="true" />
      {caption && <span className="text-xs font-medium tracking-wide text-slate-500">No photo yet</span>}
    </div>
  );
}

interface UniqueImageProps {
  /** Image claimed from the registry, or null when no unique photo exists. */
  src: string | null;
  alt: string;
  kind?: 'photo' | 'logo';
  placeholderKind?: PlaceholderKind;
  /** Smallest natural width that is sharp enough for this spot. Smaller files fall back to the placeholder. */
  minWidth?: number;
  priority?: boolean;
  sizes?: string;
  showCaption?: boolean;
  className?: string;
}

/**
 * Fills its (positioned) parent. Photos are cropped with object-fit: cover and logos are contained,
 * so nothing is stretched. A missing, broken or too-small image becomes a neutral placeholder
 * instead of a blurry or empty box.
 */
export function UniqueImage({
  src,
  alt,
  kind = 'photo',
  placeholderKind,
  minWidth,
  priority = false,
  sizes,
  showCaption = true,
  className = '',
}: UniqueImageProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'failed'>(src ? 'loading' : 'failed');
  const ref = useRef<HTMLImageElement>(null);
  const required = minWidth ?? (kind === 'logo' ? 64 : 480);

  const judge = (element: HTMLImageElement) => {
    setStatus(element.naturalWidth >= required ? 'ok' : 'failed');
  };

  useEffect(() => {
    setStatus(src ? 'loading' : 'failed');
  }, [src]);

  // A cached image can finish loading before React attaches the load listener.
  useLayoutEffect(() => {
    const element = ref.current;
    if (src && element?.complete) {
      if (element.naturalWidth > 0) judge(element);
      else if (element.naturalWidth === 0 && element.currentSrc) setStatus('failed');
    }
  }, [src]);

  // React 18 does not know the camel-cased prop, so the attribute is passed in its HTML spelling.
  const priorityProps = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};
  const fallbackKind = placeholderKind ?? (kind === 'logo' ? 'logo' : 'generic');
  if (!src || status === 'failed') {
    return <ImagePlaceholder kind={fallbackKind} caption={kind !== 'logo' && showCaption} />;
  }

  return (
    <>
      {status === 'loading' && <div className="lv-skeleton absolute inset-0" aria-hidden="true" />}
      <img
        ref={ref}
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...priorityProps}
        data-unique-image={kind}
        data-image-status={status}
        onLoad={(event) => judge(event.currentTarget)}
        onError={() => setStatus('failed')}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          kind === 'logo' ? 'object-contain p-2' : 'object-cover'
        } ${status === 'ok' ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </>
  );
}
