import React, { useRef, useState } from 'react';
import { CheckCircle2, Download, FileUp, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/db/supabase';
import {
  type ImportProduct,
  type ImportReport,
  makeSlug,
  MAX_IMAGES_PER_PRODUCT,
  MAX_IMPORT_ROWS,
  parseCsv,
  REQUIRED_COLUMNS,
  TEMPLATE_CSV,
  validateImport,
} from '@/lib/bulkProductImport';
import { probeAll } from '@/lib/imageProbe';
import type { Category } from '@/types/types';

interface BulkProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The supplier's own company. Every imported product is created under it. */
  companyId: string;
  categories: Category[];
  onImported: () => void;
  /** Checks that a photo link loads. Replaced in tests. */
  probe?: (url: string) => Promise<boolean>;
}

type Stage = 'choose' | 'checking' | 'review' | 'importing' | 'done';

interface Outcome {
  inserted: number;
  failures: Array<{ line: number; message: string }>;
}

const CHUNK_SIZE = 100;
const VISIBLE_PROBLEMS = 25;

function readText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

const toPayload = (product: ImportProduct, companyId: string) => ({
  ...product,
  company_id: companyId,
  is_active: true,
  is_featured: false,
});

function friendlyError(message: string): string {
  if (/row-level security/i.test(message)) {
    return 'Your account is not allowed to list products. Check that your company profile is active.';
  }
  return message;
}

/** Inserts one product. Retries once with a new slug if the slug was taken. Returns an error message or null. */
async function insertOne(product: ImportProduct, companyId: string): Promise<string | null> {
  const first = await supabase.from('products').insert(toPayload(product, companyId));
  if (!first.error) return null;
  if (/slug/i.test(first.error.message) && /duplicate|unique/i.test(first.error.message)) {
    const retry = await supabase
      .from('products')
      .insert(toPayload({ ...product, slug: makeSlug(product.name) }, companyId));
    return retry.error ? friendlyError(retry.error.message) : null;
  }
  return friendlyError(first.error.message);
}

export default function BulkProductImportDialog({
  open,
  onOpenChange,
  companyId,
  categories,
  onImported,
  probe,
}: BulkProductImportDialogProps) {
  const [stage, setStage] = useState<Stage>('choose');
  const [fileName, setFileName] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [confirmed, setConfirmed] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Bumped whenever the supplier starts over or leaves, so a photo check still running is dropped.
  const checkRun = useRef(0);

  // Only saving is protected. Checking photos changes nothing, so it can be cancelled or closed.
  const busy = stage === 'importing';
  const ready = report?.rows.filter((row) => row.product) ?? [];
  const problems = report?.rows.filter((row) => !row.product) ?? [];
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const reset = () => {
    checkRun.current += 1;
    setStage('choose');
    setFileName('');
    setReport(null);
    setProgress({ done: 0, total: 0 });
    setConfirmed(false);
    setOutcome(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && busy) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const downloadTemplate = () => {
    const blob = new Blob([`﻿${TEMPLATE_CSV}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulkskart-product-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setConfirmed(false);
    setOutcome(null);

    let parsed: ImportReport;
    try {
      const text = await readText(file);
      parsed = validateImport(
        parseCsv(text),
        categories.map(({ id, name, slug }) => ({ id, name, slug })),
      );
    } catch {
      toast.error('That file could not be read. Save it as a CSV file and try again.');
      return;
    }

    const candidates = parsed.rows.filter((row) => row.product);
    if (parsed.headerError || candidates.length === 0) {
      setReport(parsed);
      setStage('review');
      return;
    }

    // A listing needs a photo that loads. Check the first photo of every ready row.
    const run = checkRun.current + 1;
    checkRun.current = run;
    const cancelled = () => checkRun.current !== run;
    setStage('checking');
    const firstPhotos = candidates.map((row) => row.product?.images[0] ?? '');
    setProgress({ done: 0, total: new Set(firstPhotos).size });
    const loaded = await probeAll(
      firstPhotos,
      probe,
      8,
      (done, total) => {
        if (!cancelled()) setProgress({ done, total });
      },
      cancelled,
    );
    if (cancelled()) return;
    const rows = parsed.rows.map((row) => {
      const first = row.product?.images[0];
      if (!row.product || !first || loaded.get(first)) return row;
      return { ...row, product: null, errors: [...row.errors, `The first photo did not load: ${first.slice(0, 80)}`] };
    });
    setReport({ ...parsed, rows });
    setStage('review');
  };

  const runImport = async () => {
    if (!report) return;
    const items = report.rows.flatMap((row) => (row.product ? [{ line: row.line, product: row.product }] : []));
    setStage('importing');
    setProgress({ done: 0, total: items.length });

    let inserted = 0;
    const failures: Outcome['failures'] = [];
    for (let start = 0; start < items.length; start += CHUNK_SIZE) {
      const chunk = items.slice(start, start + CHUNK_SIZE);
      const { error } = await supabase.from('products').insert(chunk.map(({ product }) => toPayload(product, companyId)));
      if (!error) {
        inserted += chunk.length;
      } else {
        // Retry the rows one at a time so one bad row does not lose the rest of the chunk.
        for (const { line, product } of chunk) {
          const message = await insertOne(product, companyId);
          if (message === null) inserted += 1;
          else failures.push({ line, message });
        }
      }
      setProgress({ done: Math.min(start + chunk.length, items.length), total: items.length });
    }

    setOutcome({ inserted, failures });
    setStage('done');
    if (inserted > 0) onImported();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100%-2rem)] overflow-y-auto border-border bg-card md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Bulk import products</DialogTitle>
          <DialogDescription>
            List many products at once from a CSV file. Each row is checked before anything is saved.
          </DialogDescription>
        </DialogHeader>

        {stage === 'choose' && (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Each row needs a category, a description, an MOQ, a starting price and at least one link to a photo you own
              or are licensed to use (up to {MAX_IMAGES_PER_PRODUCT}, separated by |). Stock-photo and AI-image sites are
              not accepted, and up to {MAX_IMPORT_ROWS.toLocaleString('en-IN')} rows can be read per file.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={downloadTemplate} className="gap-2 font-semibold text-primary">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download template
              </Button>
              <Button type="button" onClick={() => fileInput.current?.click()} className="gap-2 font-semibold">
                <FileUp className="h-4 w-4" aria-hidden="true" />
                Choose CSV file
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                tabIndex={-1}
                className="sr-only"
                data-testid="bulk-import-file"
                aria-label="CSV file with products"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>
            <details className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none font-semibold text-foreground">Columns and categories</summary>
              <p className="mt-2">
                Required: <span className="font-mono text-foreground">{REQUIRED_COLUMNS.join(', ')}</span>. Optional:{' '}
                <span className="font-mono text-foreground">moq_unit, price_max, price_currency, specifications, tags</span>.
                Separate several photos or tags with |.
              </p>
              <p className="mt-2">
                Category must be one of: {categories.length > 0 ? categories.map((category) => category.name).join(' · ') : 'none loaded yet'}.
              </p>
            </details>
          </div>
        )}

        {stage === 'checking' && (
          <div className="space-y-3 py-4" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Checking that the first photo of each product loads…
            </p>
            <Progress value={percent} />
            <p className="text-xs text-muted-foreground">
              {progress.done} of {progress.total} photos checked. Nothing is saved yet.
            </p>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={reset} className="font-semibold text-primary">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {stage === 'review' && report && (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{fileName}</span>
            </p>

            {report.headerError ? (
              <div role="alert" className="flex gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-300">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{report.headerError}</span>
              </div>
            ) : (
              <>
                <p className="font-semibold text-foreground">
                  {report.rows.length} {report.rows.length === 1 ? 'row' : 'rows'} read · {ready.length} ready ·{' '}
                  {problems.length} need fixing
                </p>
                {report.skippedRows > 0 && (
                  <p className="text-amber-400">
                    Only the first {MAX_IMPORT_ROWS.toLocaleString('en-IN')} rows were read. {report.skippedRows} more were
                    left out. Import them in a second file.
                  </p>
                )}
                {report.ignoredColumns.length > 0 && (
                  <p className="text-xs text-muted-foreground">Ignored columns: {report.ignoredColumns.join(', ')}</p>
                )}
                {problems.length > 0 && (
                  <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/50 p-3 text-xs">
                    {problems.slice(0, VISIBLE_PROBLEMS).map((row) => (
                      <li key={row.line} className="text-red-300">
                        <span className="font-semibold">Row {row.line}</span>
                        {row.name ? ` · ${row.name}` : ''}: {row.errors.join(' ')}
                      </li>
                    ))}
                    {problems.length > VISIBLE_PROBLEMS && (
                      <li className="text-muted-foreground">…and {problems.length - VISIBLE_PROBLEMS} more rows to fix.</li>
                    )}
                  </ul>
                )}
                {ready.length > 0 && (
                  <ul className="space-y-1 rounded-lg border border-border bg-background/50 p-3 text-xs text-muted-foreground">
                    {ready.slice(0, 3).map((row) => (
                      <li key={row.line}>
                        <span className="font-semibold text-foreground">{row.product?.name}</span> · MOQ {row.product?.moq}{' '}
                        {row.product?.moq_unit} · {row.product?.price_currency} {row.product?.price_min} ·{' '}
                        {row.product?.images.length} photo{row.product?.images.length === 1 ? '' : 's'}
                      </li>
                    ))}
                    {ready.length > 3 && <li>…and {ready.length - 3} more ready rows.</li>}
                  </ul>
                )}
                {ready.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="bulk-import-rights"
                      checked={confirmed}
                      onCheckedChange={(value) => setConfirmed(value === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="bulk-import-rights" className="text-xs leading-relaxed text-muted-foreground">
                      I confirm these are my own company's products and that I own, or am licensed to use, every photo
                      linked in this file.
                    </label>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={reset} className="font-semibold text-primary">
                Choose another file
              </Button>
              {ready.length > 0 && (
                <Button type="button" disabled={!confirmed} onClick={() => void runImport()} className="font-bold">
                  Import {ready.length} {ready.length === 1 ? 'product' : 'products'}
                </Button>
              )}
            </div>
          </div>
        )}

        {stage === 'importing' && (
          <div className="space-y-3 py-4" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Importing products…
            </p>
            <Progress value={percent} />
            <p className="text-xs text-muted-foreground">
              {progress.done} of {progress.total} saved. Keep this window open.
            </p>
          </div>
        )}

        {stage === 'done' && outcome && (
          <div className="space-y-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              {outcome.inserted} {outcome.inserted === 1 ? 'product' : 'products'} imported
              {outcome.failures.length > 0 ? `, ${outcome.failures.length} failed` : ''}
            </p>
            {outcome.failures.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/50 p-3 text-xs text-red-300">
                {outcome.failures.slice(0, VISIBLE_PROBLEMS).map((failure) => (
                  <li key={failure.line}>
                    <span className="font-semibold">Row {failure.line}</span>: {failure.message}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={() => handleOpenChange(false)} className="font-bold">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
