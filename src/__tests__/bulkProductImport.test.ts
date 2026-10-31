import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MAX_IMPORT_ROWS,
  makeSlug,
  parseCsv,
  photoUrlProblem,
  REQUIRED_COLUMNS,
  TEMPLATE_CSV,
  validateImport,
} from '@/lib/bulkProductImport';

const categories = [
  { id: 'cat-steel', name: 'Steel & Metal', slug: 'steel-metal' },
  { id: 'cat-textile', name: 'Textiles', slug: 'textiles' },
];

const HEADER = 'name,category,description,moq,moq_unit,price_min,price_max,price_currency,images,specifications,tags';

const PHOTO = 'https://cdn.example-supplier.in/photos/pipe-1.jpg';

/** One valid CSV data line. Pass overrides by column name. */
function line(overrides: Record<string, string> = {}): string {
  const values: Record<string, string> = {
    name: 'Stainless Steel Pipe 304',
    category: 'Steel & Metal',
    description: 'Seamless stainless steel pipe, grade 304, supplied in 6 metre lengths.',
    moq: '500',
    moq_unit: 'Kg',
    price_min: '210',
    price_max: '260',
    price_currency: 'INR',
    images: PHOTO,
    specifications: 'OD 25mm, wall 2mm',
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

const csv = (...lines: string[]) => [HEADER, ...lines].join('\n');
const run = (...lines: string[]) => validateImport(parseCsv(csv(...lines)), categories);

describe('parseCsv', () => {
  it('reads quoted fields, doubled quotes, embedded line breaks and CRLF', () => {
    const table = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n"line1\nline2",z\r\n');
    expect(table).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['line1\nline2', 'z'],
    ]);
  });

  it('drops a leading byte order mark', () => {
    expect(parseCsv('﻿name,category\nPipe,Steel')[0]).toEqual(['name', 'category']);
  });

  it('detects a semicolon or tab delimiter from the header line', () => {
    expect(parseCsv('name;category\nPipe;Steel')[1]).toEqual(['Pipe', 'Steel']);
    expect(parseCsv('name\tcategory\nPipe\tSteel')[1]).toEqual(['Pipe', 'Steel']);
  });
});

describe('validateImport', () => {
  it('accepts a complete row and maps every field', () => {
    const report = run(line());
    expect(report.headerError).toBeNull();
    expect(report.rows).toHaveLength(1);
    const { product, errors } = report.rows[0];
    expect(errors).toEqual([]);
    expect(product).toMatchObject({
      name: 'Stainless Steel Pipe 304',
      category_id: 'cat-steel',
      moq: 500,
      moq_unit: 'Kg',
      price_min: 210,
      price_max: 260,
      price_currency: 'INR',
      images: [PHOTO],
      specifications: 'OD 25mm, wall 2mm',
      tags: ['pipe', 'stainless'],
    });
    expect(product?.slug).toMatch(/^stainless-steel-pipe-304-[a-z0-9]{6}$/);
  });

  it('matches categories by name or slug, ignoring case and ampersands', () => {
    const report = run(line({ category: 'steel and metal' }), line({ name: 'Cotton Fabric Roll', category: 'TEXTILES' }), line({ name: 'Another Pipe', category: 'steel-metal' }));
    expect(report.rows.map((row) => row.product?.category_id)).toEqual(['cat-steel', 'cat-textile', 'cat-steel']);
  });

  it('applies defaults and accepts formatted numbers', () => {
    const { product } = run(line({ moq: '1,000', moq_unit: '', price_min: '₹1,250.50', price_max: '', price_currency: 'usd' })).rows[0];
    expect(product).toMatchObject({ moq: 1000, moq_unit: 'Pcs', price_min: 1250.5, price_max: null, price_currency: 'USD' });
  });

  it('removes duplicate photo links and keeps the order', () => {
    const second = 'https://cdn.example-supplier.in/photos/pipe-2.jpg';
    const { product } = run(line({ images: `${PHOTO}|${second}|${PHOTO}` })).rows[0];
    expect(product?.images).toEqual([PHOTO, second]);
  });

  it('explains every problem it finds in a row', () => {
    const [row] = run(
      line({ name: 'ab', category: 'Spaceships', description: 'too short', moq: '2.5', price_min: '0', images: '' }),
    ).rows;
    expect(row.product).toBeNull();
    expect(row.errors.join(' | ')).toMatch(/Name must be at least 3/);
    expect(row.errors.join(' | ')).toMatch(/Unknown category "Spaceships"/);
    expect(row.errors.join(' | ')).toMatch(/Description must be at least 15/);
    expect(row.errors.join(' | ')).toMatch(/MOQ must be a whole number/);
    expect(row.errors.join(' | ')).toMatch(/Starting price/);
    expect(row.errors.join(' | ')).toMatch(/At least one photo link/);
  });

  it('rejects a maximum price below the starting price and bad currencies', () => {
    const [row] = run(line({ price_min: '300', price_max: '200', price_currency: 'RUPEES' })).rows;
    expect(row.errors).toContain('Maximum price cannot be lower than the starting price.');
    expect(row.errors).toContain('Currency must be a 3-letter code such as INR or USD.');
  });

  it('flags a repeated name and category with the first row number', () => {
    const report = run(line(), line(), line({ name: 'Different Pipe' }));
    expect(report.rows[1].errors).toEqual(['Same name and category as row 2.']);
    expect(report.rows[2].product).not.toBeNull();
  });

  it('skips blank lines but keeps spreadsheet row numbers', () => {
    const report = validateImport(parseCsv(`${HEADER}\n${line()}\n\n${line({ name: 'Second Pipe' })}\n`), categories);
    expect(report.rows.map((row) => row.line)).toEqual([2, 4]);
  });

  it('reports missing required columns and ignored columns', () => {
    const report = validateImport(parseCsv('name,category,notes\nPipe,Steel,hello'), categories);
    expect(report.headerError).toMatch(/Missing required columns: description, moq, price_min, images/);
    expect(report.ignoredColumns).toEqual(['notes']);
    expect(report.rows).toEqual([]);
  });

  it('accepts common alternative column names', () => {
    const table = parseCsv(
      `Product Name,Category Name,Description,Minimum Order Quantity,Price,Photos\nSteel Rod 12mm,Steel & Metal,"Hot rolled steel rod, 12mm diameter.",100,95,${PHOTO}`,
    );
    const report = validateImport(table, categories);
    expect(report.headerError).toBeNull();
    expect(report.rows[0].product).toMatchObject({ name: 'Steel Rod 12mm', moq: 100, price_min: 95 });
  });

  it('reads at most MAX_IMPORT_ROWS rows and says how many it left out', () => {
    const lines = Array.from({ length: MAX_IMPORT_ROWS + 5 }, (_, index) => line({ name: `Pipe model ${index}` }));
    const started = Date.now();
    const report = run(...lines);
    expect(report.rows).toHaveLength(MAX_IMPORT_ROWS);
    expect(report.skippedRows).toBe(5);
    expect(report.rows.every((row) => row.product)).toBe(true);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});

describe('photoUrlProblem', () => {
  it('accepts a normal https photo link', () => {
    expect(photoUrlProblem(PHOTO)).toBeNull();
  });

  it.each([
    'https://images.unsplash.com/photo-1',
    'https://cdn.pixabay.com/photo/2016/09/12/a.jpg',
    'https://images.pexels.com/photos/1/x.jpeg',
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_x.jpg',
  ])('refuses the stock or AI image host %s', (link) => {
    expect(photoUrlProblem(link)).toMatch(/stock or AI image site/);
  });

  it('refuses plain http, private hosts and text that is not a link', () => {
    expect(photoUrlProblem('http://cdn.example-supplier.in/a.jpg')).toMatch(/must use https/);
    expect(photoUrlProblem('https://192.168.1.10/a.jpg')).toMatch(/not a public photo host/);
    expect(photoUrlProblem('https://localhost/a.jpg')).toMatch(/not a public photo host/);
    expect(photoUrlProblem('not a link')).toMatch(/not a valid link/);
  });
});

describe('makeSlug', () => {
  it('builds a url-safe slug with the given suffix', () => {
    expect(makeSlug('  Heavy-Duty  Pump (3HP) / 440V ', 'abc123')).toBe('heavy-duty-pump-3hp-440v-abc123');
  });

  it('falls back to "product" when the name has no latin letters or digits', () => {
    expect(makeSlug('मशीन', 'abc123')).toBe('product-abc123');
  });
});

describe('template', () => {
  it('lists every required column in the header row', () => {
    const header = TEMPLATE_CSV.trim().split(',');
    for (const column of REQUIRED_COLUMNS) expect(header).toContain(column);
  });

  it('is identical to the downloadable file in /public/templates', () => {
    const file = readFileSync(
      path.resolve(import.meta.dirname, '../../public/templates/bulkskart-product-import-template.csv'),
      'utf8',
    );
    expect(file).toBe(TEMPLATE_CSV);
  });

  it('contains no product rows, so nothing can be imported from it by accident', () => {
    expect(validateImport(parseCsv(TEMPLATE_CSV), categories).rows).toEqual([]);
  });
});
