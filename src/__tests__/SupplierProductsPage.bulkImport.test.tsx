import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import SupplierProductsPage from '@/pages/dashboard/supplier/SupplierProductsPage';

const { auth, getProducts, getCategories, toastMessage } = vi.hoisted(() => ({
  auth: { current: { user: { id: 'user-1' }, company: { id: 'company-1' } as { id: string } | null, isPaidSubscriber: true } },
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  toastMessage: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth.current }));
vi.mock('@/lib/api', () => ({
  getProducts,
  getCategories,
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));
vi.mock('@/db/supabase', () => ({ supabase: { from: () => ({ insert: vi.fn() }) } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: toastMessage } }));
vi.mock('@/components/layouts/DashboardLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/common/PageMeta', () => ({ default: () => null }));
vi.mock('@/components/common/ProductPromotionsPanel', () => ({ default: () => null }));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  getProducts.mockResolvedValue([]);
  getCategories.mockResolvedValue([{ id: 'cat-steel', name: 'Steel & Metal', slug: 'steel-metal' }]);
  toastMessage.mockReset();
  auth.current = { user: { id: 'user-1' }, company: { id: 'company-1' }, isPaidSubscriber: true };
});

afterEach(() => cleanup());

const renderPage = () =>
  render(
    <MemoryRouter>
      <SupplierProductsPage />
    </MemoryRouter>,
  );

describe('My Products: Bulk Import button', () => {
  it('opens the bulk import dialog for a supplier with an active plan', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Bulk Import/ }));

    expect(await screen.findByText('Bulk import products')).toBeInTheDocument();
    expect(screen.queryByText('Subscription Required to Upload Products')).not.toBeInTheDocument();
  });

  it('shows the same subscription prompt as Add Product when there is no active plan', async () => {
    auth.current = { ...auth.current, isPaidSubscriber: false };
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Bulk Import/ }));

    expect(await screen.findByText('Subscription Required to Upload Products')).toBeInTheDocument();
    expect(screen.queryByText('Bulk import products')).not.toBeInTheDocument();
    expect(toastMessage).toHaveBeenCalledWith('Subscription required to add products', expect.anything());
  });

  it('offers the category names that the supplier can use in the file', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Bulk Import/ }));
    await user.click(await screen.findByText('Columns and categories'));

    expect(await screen.findByText(/Category must be one of: Steel & Metal/)).toBeInTheDocument();
  });

  it('keeps Add Product available next to it', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /Add Product/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bulk Import/ })).toBeInTheDocument();
  });
});
