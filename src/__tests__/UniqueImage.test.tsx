import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UniqueImage } from '@/components/landing/UniqueImage';

afterEach(() => cleanup());

const show = (props: Partial<React.ComponentProps<typeof UniqueImage>> = {}) =>
  render(
    <div style={{ position: 'relative', width: 300, height: 200 }}>
      <UniqueImage src="https://files.test/photo.jpg" alt="Factory floor" {...props} />
    </div>,
  );

const loadWith = (img: HTMLElement, naturalWidth: number) => {
  Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
  fireEvent.load(img);
};

describe('UniqueImage', () => {
  it('shows a neutral placeholder, not an image, when there is no photo', () => {
    const { container } = show({ src: null, placeholderKind: 'factory' });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-placeholder="factory"]')).not.toBeNull();
    expect(screen.getByRole('img', { name: 'No photo available' })).toBeInTheDocument();
  });

  it('loads photos lazily and decodes them off the main thread', () => {
    const { container } = show();
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('alt', 'Factory floor');
  });

  it('loads an above-the-fold photo eagerly with high priority', () => {
    const { container } = show({ priority: true });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('keeps a sharp photo and crops it instead of stretching it', () => {
    const { container } = show();
    const img = container.querySelector('img') as HTMLImageElement;
    loadWith(img, 1200);
    expect(img).toHaveAttribute('data-image-status', 'ok');
    expect(img.className).toMatch(/object-cover/);
    expect(container.querySelector('[data-placeholder]')).toBeNull();
  });

  it('replaces a photo that is too small to be sharp', () => {
    const { container } = show();
    loadWith(container.querySelector('img') as HTMLElement, 300);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-placeholder]')).not.toBeNull();
  });

  it('replaces a broken link', () => {
    const { container } = show();
    fireEvent.error(container.querySelector('img') as HTMLElement);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-placeholder]')).not.toBeNull();
  });

  it('contains logos instead of cropping them, with a lower size limit', () => {
    const { container } = show({ kind: 'logo', src: 'https://files.test/logo.png', alt: 'Logo' });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.className).toMatch(/object-contain/);
    loadWith(img, 96);
    expect(img).toHaveAttribute('data-image-status', 'ok');
  });

  it('replaces a logo smaller than the limit and never shows text as a stand-in logo', () => {
    const { container } = show({ kind: 'logo', src: 'https://files.test/logo.png', alt: 'Logo' });
    loadWith(container.querySelector('img') as HTMLElement, 24);
    expect(container.querySelector('[data-placeholder="logo"]')).not.toBeNull();
    expect(container.textContent).toBe('');
  });

  it('recovers when it is handed a new photo', () => {
    const { container, rerender } = show();
    fireEvent.error(container.querySelector('img') as HTMLElement);
    expect(container.querySelector('img')).toBeNull();
    rerender(
      <div style={{ position: 'relative' }}>
        <UniqueImage src="https://files.test/other.jpg" alt="Another" />
      </div>,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://files.test/other.jpg');
  });
});
