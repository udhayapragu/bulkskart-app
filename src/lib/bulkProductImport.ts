/**
 * CSV bulk import for supplier product listings. Parsing and validation only: there is no
 * network and no React in this file, so it can be tested on its own.
 *
 * A row has to meet the same bar as the single-product form: a real category, a description,
 * an MOQ, a starting price and at least one photo. Photos from stock-photo or AI-image hosts are
 * refused, because a listing must carry the supplier's own or licensed photographs.
 */

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMAGES_PER_PRODUCT = 6;
const MAX_TAGS = 10;
const MAX_AMOUNT = 9_999_999_999.99;
const MAX_MOQ = 1_000_000_000;

const BLOCKED_IMAGE_HOSTS = ['pixabay.com', 'unsplash.com', 'pexels.com', 'miaoda-site-img.s3cdn.medo.dev'];

export const TEMPLATE_COLUMNS = [
  'name',
  'category',
  'description',
  'moq',
  'moq_unit',
  'price_min',
  'price_max',
  'price_currency',
  'images',
  'specifications',
  'tags',
] as const;

export const REQUIRED_COLUMNS = ['name', 'category', 'description', 'moq', 'price_min', 'images'] as const;

export const TEMPLATE_CSV = `${TEMPLATE_COLUMNS.join(',')}\r\n`;

/** Other spellings of a column that people commonly use. */
const HEADER_ALIASES: Record<string, string> = {
  product_name: 'name',
  product: 'name',
  title: 'name',
  category_name: 'category',
  category_slug: 'category',
  minimum_order_quantity: 'moq',
  min_order: 'moq',
  unit: 'moq_unit',
  currency: 'price_currency',
  price: 'price_min',
  starting_price: 'price_min',
  min_price: 'price_min',
  max_price: 'price_max',
  photos: 'images',
  photo_urls: 'images',
  image_urls: 'images',
  image: 'images',
  specs: 'specifications',
};

export interface ImportCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ImportProduct {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  specifications: string | null;
  moq: number;
  moq_unit: string;
  price_min: number;
  price_max: number | null;
  price_currency: string;
  images: string[];
  tags: string[] | null;
}

export interface ImportRow {
  /** Row number as a spreadsheet shows it. The header is row 1. */
  line: number;
  name: string;
  errors: string[];
  product: ImportProduct | null;
}

export interface ImportReport {
  headerError: string | null;
  /** Columns in the file that the importer does not use. */
  ignoredColumns: string[];
  rows: ImportRow[];
  /** Rows beyond the per-file limit that were not read. */
  skippedRows: number;
}

const normaliseHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** Comma, semicolon or tab, whichever the header line uses outside quotes. */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (const char of firstLine) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char] += 1;
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? best : ',';
}

/** CSV parser with quoted fields, doubled quotes, embedded line breaks, CRLF and a leading BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function randomSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0].toString(36).padStart(6, '0').slice(-6);
  }
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}

/** URL-safe slug with a random suffix, because product slugs must be unique across the marketplace. */
export function makeSlug(name: string, suffix: string = randomSuffix()): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return `${base || 'product'}-${suffix}`;
}

const matchKey = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₹$€£]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Math.round(Number(cleaned) * 100) / 100;
  return Number.isFinite(value) && value <= MAX_AMOUNT ? value : null;
}

/** Returns an error message, or null when the URL is an acceptable photo link. */
export function photoUrlProblem(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return `"${raw.slice(0, 60)}" is not a valid link`;
  }
  if (url.protocol !== 'https:') return `${url.hostname || raw.slice(0, 40)} must use https`;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === 'localhost') {
    return `${host} is not a public photo host`;
  }
  if (BLOCKED_IMAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return `${host} is a stock or AI image site. Use your own or licensed photos`;
  }
  if (raw.length > 2000) return 'link is too long';
  return null;
}

export function validateImport(table: string[][], categories: ImportCategory[]): ImportReport {
  const empty = (headerError: string | null, ignoredColumns: string[] = []): ImportReport => ({
    headerError,
    ignoredColumns,
    rows: [],
    skippedRows: 0,
  });

  const [headerRow, ...body] = table;
  if (!headerRow || headerRow.every((cell) => cell.trim() === '')) return empty('The file is empty.');

  const columnIndex = new Map<string, number>();
  const ignoredColumns: string[] = [];
  headerRow.forEach((raw, index) => {
    const normalised = normaliseHeader(raw);
    const key = HEADER_ALIASES[normalised] ?? normalised;
    if ((TEMPLATE_COLUMNS as readonly string[]).includes(key) && !columnIndex.has(key)) {
      columnIndex.set(key, index);
    } else if (raw.trim() !== '') {
      ignoredColumns.push(raw.trim());
    }
  });

  const missing = REQUIRED_COLUMNS.filter((column) => !columnIndex.has(column));
  if (missing.length > 0) {
    return empty(
      `Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}. Start from the template.`,
      ignoredColumns,
    );
  }

  const byName = new Map(categories.map((category) => [matchKey(category.name), category]));
  const bySlug = new Map(categories.map((category) => [matchKey(category.slug), category]));

  const candidates = body
    .map((cells, offset) => ({ cells, line: offset + 2 }))
    .filter(({ cells }) => cells.some((cell) => cell.trim() !== ''));
  const skippedRows = Math.max(candidates.length - MAX_IMPORT_ROWS, 0);

  const firstLineSeen = new Map<string, number>();
  const rows: ImportRow[] = candidates.slice(0, MAX_IMPORT_ROWS).map(({ cells, line }) => {
    const read = (column: string): string => {
      const index = columnIndex.get(column);
      return index === undefined ? '' : (cells[index] ?? '').trim();
    };
    const errors: string[] = [];

    const name = read('name');
    if (name.length < 3) errors.push('Name must be at least 3 characters.');
    else if (name.length > 150) errors.push('Name must be 150 characters or fewer.');

    const categoryText = read('category');
    const category = categoryText ? (byName.get(matchKey(categoryText)) ?? bySlug.get(matchKey(categoryText))) : undefined;
    if (!categoryText) errors.push('Category is required.');
    else if (!category) errors.push(`Unknown category "${categoryText}". Use a category name from the list.`);

    const description = read('description');
    if (description.length < 15) errors.push('Description must be at least 15 characters.');
    else if (description.length > 4000) errors.push('Description must be 4000 characters or fewer.');

    const moqText = read('moq').replace(/,/g, '');
    const moq = /^\d+$/.test(moqText) ? Number(moqText) : Number.NaN;
    if (!Number.isInteger(moq) || moq < 1) errors.push('MOQ must be a whole number of 1 or more.');
    else if (moq > MAX_MOQ) errors.push('MOQ is too large.');

    const moqUnit = read('moq_unit') || 'Pcs';
    if (moqUnit.length > 24) errors.push('MOQ unit must be 24 characters or fewer.');

    const priceMin = parseAmount(read('price_min'));
    if (priceMin === null || priceMin <= 0) errors.push('Starting price (price_min) must be a number above 0.');

    const priceMaxText = read('price_max');
    const priceMax = priceMaxText ? parseAmount(priceMaxText) : null;
    if (priceMaxText && priceMax === null) errors.push('Maximum price (price_max) must be a number.');
    else if (priceMax !== null && priceMin !== null && priceMax < priceMin) {
      errors.push('Maximum price cannot be lower than the starting price.');
    }

    const currencyText = read('price_currency') || 'INR';
    if (!/^[A-Za-z]{3}$/.test(currencyText)) errors.push('Currency must be a 3-letter code such as INR or USD.');

    const imageList = [...new Set(read('images').split(/[|\s]+/).filter(Boolean))];
    if (imageList.length === 0) errors.push('At least one photo link is required.');
    else if (imageList.length > MAX_IMAGES_PER_PRODUCT) {
      errors.push(`Use ${MAX_IMAGES_PER_PRODUCT} photo links or fewer.`);
    } else {
      for (const link of imageList) {
        const problem = photoUrlProblem(link);
        if (problem) {
          errors.push(`Photo: ${problem}.`);
          break;
        }
      }
    }

    const specifications = read('specifications');
    if (specifications.length > 4000) errors.push('Specifications must be 4000 characters or fewer.');

    const tagList = read('tags')
      .split('|')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tagList.length > MAX_TAGS) errors.push(`Use ${MAX_TAGS} tags or fewer.`);
    else if (tagList.some((tag) => tag.length > 40)) errors.push('Each tag must be 40 characters or fewer.');

    if (errors.length === 0 && category) {
      const duplicateKey = `${category.id}|${name.toLowerCase()}`;
      const firstLine = firstLineSeen.get(duplicateKey);
      if (firstLine !== undefined) errors.push(`Same name and category as row ${firstLine}.`);
      else firstLineSeen.set(duplicateKey, line);
    }

    if (errors.length > 0 || !category || priceMin === null) {
      return { line, name, errors, product: null };
    }
    return {
      line,
      name,
      errors,
      product: {
        name,
        slug: makeSlug(name),
        category_id: category.id,
        description,
        specifications: specifications || null,
        moq,
        moq_unit: moqUnit,
        price_min: priceMin,
        price_max: priceMax,
        price_currency: currencyText.toUpperCase(),
        images: imageList,
        tags: tagList.length > 0 ? tagList : null,
      },
    };
  });

  return { headerError: null, ignoredColumns, rows, skippedRows };
}
