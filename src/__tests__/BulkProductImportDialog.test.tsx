import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import BulkProductImportDialog from '@/components/common/BulkProductImportDialog';
import type { Category } from '@/types/types';

type InsertResult = { error: { message: string } | null };

const { insert, toastError } = vi.hoisted(() => ({
  insert: vi.fn<(payload: unknown) => Promise<InsertResult>>(),
  toastError: vi.fn(),
}));

vi.mock('@/db/supabase', () => ({
  supabase: { from: () => ({ insert }) },
}));

vi.mock('sonner', () => ({
  toast: { error: toastError, success: vi.fn(), message: vi.fn() },
}));

beforeAll(() => {
  // Radix measures the checkbox with ResizeObserver, which jsdom does not provide.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const categories = [
  { id: 'cat-steel', name: 'Steel & Metal', slug: 'steel-metal' },
  { id: 'cat-textile', name: 'Textiles', slug: 'textiles' },
] as Category[];

const HEADER = 'name,category,description,moq,moq_unit,price_min,price_max,price_currency,images,specifications,tags';
const photoOf = (index: number) => `https://cdn.example-supplier.in/photos/pipe-${index}.jpg`;

/** One valid data line for product number `index`. */
function row(index: number, overrides: Record<string, string> = {}): string {
  const values: Record<string, string> = {
    name: `Stainless Steel Pipe model ${index}`,
    category: 'Steel & Metal',
    description: 'Seamless stainless steel pipe, grade 304, supplied in 6 metre lengths.',
    moq: '500',
    moq_unit: 'Kg',
    price_min: '210',
    price_max: '260',
    price_currency: 'INR',
    images: photoOf(index),
    specifications: 'OD 25mm',
    tags: 'pipe|stainless',
    ...overrides,
  };
  return HEADER.split(',')
    .map((column) => {
      const value = values[column] ?? '';
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    })
    .join(',');
}

const csvFile = (lines: string[], header = HEADER) =>
  new File([[header, ...lines].join('\n')], 'products.csv', { type: 'text/csv' });

const productRows = (count: number) => Array.from({ length: count }, (_, index) => row(index + 1));

const alwaysLoads = async () => true;

function setup(probe: (url: string) => Promise<boolean> = alwaysLoads) {
  const onOpenChange = vi.fn();
  const onImported = vi.fn();
  const user = userEvent.setup();
  render(
    <BulkProductImportDialog
      open
      onOpenChange={onOpenChange}
      companyId="company-1"
      categories={categories}
      onImported={onImported}
      probe={probe}
    />,
  );
  const upload = (file: File) => user.upload(screen.getByTestId('bulk-import-file'), file);
  return { user, upload, onOpenChange, onImported };
}

const insertedBatches = () => insert.mock.calls.map(([payload]) => payload);

beforeEach(() => {
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  toastError.mockReset();
});

afterEach(() => cleanup());

describe('BulkProductImportDialog', () => {
  it('reads the file, asks for a rights confirmation, then imports in chunks of 100', async () => {
    const { user, upload, onImported } = setup();
    await upload(csvFile(productRows(250)));

    expect(await screen.findByText('250 rows read · 250 ready · 0 need fixing')).toBeInTheDocument();
    const importButton = screen.getByRole('button', { name: 'Import 250 products' });
    expect(importButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(importButton).toBeEnabled();
    await user.click(importButton);

    expect(await screen.findByText('250 products imported')).toBeInTheDocument();
    expect(insert).toHaveBeenCalledTimes(3);
    const batches = insertedBatches() as Array<Array<Record<string, unknown>>>;
    expect(batches.map((batch) => batch.length)).toEqual([100, 100, 50]);
    expect(batches[0][0]).toMatchObject({
      company_id: 'company-1',
      category_id: 'cat-steel',
      name: 'Stainless Steel Pipe model 1',
      moq: 500,
      moq_unit: 'Kg',
      price_min: 210,
      price_max: 260,
      price_currency: 'INR',
      images: [photoOf(1)],
      is_active: true,
      is_featured: false,
    });
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('imports nothing until the rights box is ticked', async () => {
    const { upload } = setup();
    await upload(csvFile(productRows(2)));

    expect(await screen.findByRole('button', { name: 'Import 2 products' })).toBeDisabled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('shows the problem of each bad row and imports only the good ones', async () => {
    const { user, upload } = setup();
    await upload(
      csvFile([
        row(1),
        row(2, { category: 'Spaceships' }),
        row(3, { images: 'http://insecure.example.in/a.jpg' }),
        row(4, { images: 'https://images.unsplash.com/photo-1' }),
        row(5),
      ]),
    );

    expect(await screen.findByText('5 rows read · 2 ready · 3 need fixing')).toBeInTheDocument();
    expect(screen.getByText(/Unknown category "Spaceships"/)).toBeInTheDocument();
    expect(screen.getByText(/must use https/)).toBeInTheDocument();
    expect(screen.getByText(/stock or AI image site/)).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Import 2 products' }));
    expect(await screen.findByText('2 products imported')).toBeInTheDocument();
    const [batch] = insertedBatches() as Array<Array<{ name: string }>>;
    expect(batch.map((product) => product.name)).toEqual([
      'Stainless Steel Pipe model 1',
      'Stainless Steel Pipe model 5',
    ]);
  });

  it('rejects a row whose first photo does not load', async () => {
    const { upload } = setup(async (url) => url !== photoOf(2));
    await upload(csvFile(productRows(3)));

    expect(await screen.findByText('3 rows read · 2 ready · 1 need fixing')).toBeInTheDocument();
    expect(screen.getByText(/Row 3/)).toBeInTheDocument();
    expect(screen.getByText(/The first photo did not load/)).toBeInTheDocument();
  });

  it('explains a missing column instead of importing', async () => {
    const { upload } = setup();
    await upload(csvFile(['Pipe,Steel & Metal,hello'], 'name,category,notes'));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Missing required columns: description, moq, price_min, images/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Import \d+/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose another file' })).toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });

  it('retries a failed chunk row by row so one bad row does not lose the others', async () => {
    insert.mockImplementation(async (payload) => {
      if (Array.isArray(payload)) return { error: { message: 'new row violates check constraint' } };
      const { name } = payload as { name: string };
      return name.endsWith('model 2')
        ? { error: { message: 'new row violates row-level security policy for table "products"' } }
        : { error: null };
    });
    const { user, upload, onImported } = setup();
    await upload(csvFile(productRows(3)));
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Import 3 products' }));

    expect(await screen.findByText('2 products imported, 1 failed')).toBeInTheDocument();
    expect(screen.getByText(/Row 3/)).toBeInTheDocument();
    expect(screen.getByText(/Your account is not allowed to list products/)).toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('gives a product a new slug once when its slug was already taken', async () => {
    const taken = 'duplicate key value violates unique constraint "products_slug_key"';
    let singles = 0;
    insert.mockImplementation(async (payload) => {
      if (Array.isArray(payload)) return { error: { message: taken } };
      singles += 1;
      return singles === 1 ? { error: { message: taken } } : { error: null };
    });
    const { user, upload } = setup();
    await upload(csvFile(productRows(1)));
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Import 1 product' }));

    expect(await screen.findByText('1 product imported')).toBeInTheDocument();
    const [chunk, first, retry] = insertedBatches() as Array<Array<{ slug: string }> | { slug: string }>;
    expect(Array.isArray(chunk)).toBe(true);
    expect((retry as { slug: string }).slug).not.toBe((first as { slug: string }).slug);
  });

  it('does not report success or call onImported when every row fails', async () => {
    insert.mockResolvedValue({ error: { message: 'permission denied' } });
    const { user, upload, onImported } = setup();
    await upload(csvFile(productRows(2)));
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Import 2 products' }));

    expect(await screen.findByText('0 products imported, 2 failed')).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });

  it('cannot be closed while products are being saved', async () => {
    let release: (result: InsertResult) => void = () => {};
    insert.mockImplementation(() => new Promise<InsertResult>((resolve) => (release = resolve)));
    const { user, upload, onOpenChange } = setup();
    await upload(csvFile(productRows(1)));
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Import 1 product' }));
    expect(await screen.findByText('Importing products…')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByText('Importing products…')).toBeInTheDocument();

    release({ error: null });
    expect(await screen.findByText('1 product imported')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('cancels the photo check without showing results or saving anything', async () => {
    const waiting: Array<(loaded: boolean) => void> = [];
    const { user, upload } = setup(() => new Promise<boolean>((resolve) => waiting.push(resolve)));
    await upload(csvFile(productRows(3)));
    expect(await screen.findByText(/Checking that the first photo of each product loads/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Choose CSV file' })).toBeInTheDocument();

    // Photos that finish loading afterwards must not bring the review screen back.
    for (const resolve of waiting) resolve(true);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(screen.getByRole('button', { name: 'Choose CSV file' })).toBeInTheDocument();
    expect(screen.queryByText(/rows read/)).not.toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });

  it('can be closed while photos are being checked, because nothing has been saved yet', async () => {
    const { user, upload, onOpenChange } = setup(() => new Promise<boolean>(() => {}));
    await upload(csvFile(productRows(1)));
    await screen.findByText(/Checking that the first photo of each product loads/);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('lets the supplier pick a different file after reviewing', async () => {
    const { user, upload } = setup();
    await upload(csvFile(productRows(2)));
    await screen.findByText('2 rows read · 2 ready · 0 need fixing');

    await user.click(screen.getByRole('button', { name: 'Choose another file' }));
    expect(screen.getByRole('button', { name: 'Choose CSV file' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
