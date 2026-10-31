import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Search, Sun, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BrandLogo from '@/components/common/BrandLogo';
import CopyPublicProfileButton from '@/components/common/CopyPublicProfileButton';
import NotificationBell from '@/components/common/NotificationBell';
import LocaleControls from '@/components/layouts/LocaleControls';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTopCategories } from '@/hooks/useHomepageData';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Products', href: '/products' },
  { label: 'Suppliers', href: '/manufacturers' },
  { label: 'RFQ', href: '/requirements' },
  { label: 'Auctions', href: '/auctions' },
];

const TRADE_TOOLS: NavItem[] = [
  { label: 'AI Import & Export Assistant', href: '/trade-assistant' },
  { label: 'Shipping Calculator', href: '/shipping-calculator' },
  { label: 'Order Loan Calculator', href: '/loan-calculator' },
];

const RESOURCES: NavItem[] = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Categories', href: '/categories' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

const PRIMARY_BUTTON = 'bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90';

/** Dropdown of links for Trade Tools, Resources, and the Buyer and Supplier menus. */
function MenuDropdown({ label, items, className }: { label: string; items: NavItem[]; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 gap-1 px-2.5 text-sm font-semibold text-foreground hover:text-primary', className)}
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 border-border bg-popover">
        {items.map((item) => (
          <DropdownMenuItem key={`${label}-${item.href}`} asChild>
            <Link to={item.href} className="cursor-pointer">
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={`${title}-${item.href}`}>
            <Link
              to={item.href}
              onClick={onNavigate}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Header() {
  const { user, profile, signOut, loading, resolvedRole, displayName, dashboardPath } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { getPrefetchHandlers } = usePrefetch();
  const categories = useTopCategories();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isSupplier = resolvedRole === 'supplier' || profile?.role === 'supplier';
  const isAdmin = resolvedRole === 'admin' || profile?.role === 'admin';
  const accountLabel = isSupplier ? 'Supplier' : isAdmin ? 'Admin' : 'Buyer';
  const profilePath = isSupplier ? '/dashboard/supplier/profile' : '/dashboard/buyer/profile';

  const getDashboardLink = () => {
    if (!user) return '/auth';
    if (loading) return dashboardPath !== '/auth' ? dashboardPath : '/auth';
    if (dashboardPath && dashboardPath !== '/auth') return dashboardPath;
    if (!profile && !resolvedRole) return '/auth';
    if (isAdmin) return '/dashboard/admin';
    if (isSupplier) return '/dashboard/supplier';
    return '/dashboard/buyer';
  };
  const dashboardLink = getDashboardLink();
  const firstName = (displayName || profile?.full_name || 'Account').split(' ')[0];
  const initial = (displayName || profile?.full_name || user?.email || 'U')[0]?.toUpperCase() ?? 'U';

  const buyerItems: NavItem[] = [
    { label: 'Post a Requirement', href: '/post-requirement' },
    { label: 'Browse Products', href: '/products' },
    user && !isSupplier
      ? { label: 'Buyer Dashboard', href: dashboardLink }
      : { label: 'Join as Buyer', href: '/register' },
  ];
  const supplierItems: NavItem[] = [
    user && isSupplier
      ? { label: 'Supplier Dashboard', href: dashboardLink }
      : { label: 'Join as Manufacturer', href: '/auth?tab=supplier' },
    { label: 'Subscription Plans', href: '/pricing' },
    { label: 'Live RFQs from buyers', href: '/requirements' },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);
  const closeMenu = () => setMobileOpen(false);

  const submitSearch = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/products?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    closeMenu();
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      setUserMenuOpen(false);
      closeMenu();
      await signOut();
      toast.success('Signed out successfully');
      if (location.pathname !== '/') {
        navigate('/');
      }
    } catch (err) {
      console.error('Sign out error:', err);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="relative z-30 w-full border-b border-border bg-background">
      {/* Utility bar: buyer and supplier menus, country, language and theme. Tablet and desktop only. */}
      <div className="hidden border-b border-border bg-muted/40 md:block">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            <MenuDropdown label="Buyer" items={buyerItems} className="h-7 text-xs" />
            <MenuDropdown label="Supplier" items={supplierItems} className="h-7 text-xs" />
          </div>
          <div className="flex items-center gap-1">
            <LocaleControls variant="compact" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main row */}
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:h-16">
        <Link to="/" className="shrink-0" aria-label="BulkSkart home">
          <BrandLogo size="responsive" linkTo={null} />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {PRIMARY_NAV.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              {...getPrefetchHandlers(link.href)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:text-primary',
                isActive(link.href) ? 'text-primary' : 'text-foreground/85',
              )}
            >
              {link.label}
            </Link>
          ))}
          <MenuDropdown label="Trade Tools" items={TRADE_TOOLS} />
          <MenuDropdown label="Resources" items={RESOURCES} />
        </nav>

        <div className="ml-auto flex items-center gap-1 xl:ml-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 xl:hidden"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="hidden items-center gap-1 xl:flex">
            <CopyPublicProfileButton />
          </div>
          <NotificationBell />

          {user ? (
            <>
              <Link
                to={dashboardLink}
                aria-label="Open dashboard"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground xl:hidden"
              >
                {initial}
              </Link>
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="My account menu"
                    className="hidden h-9 gap-2 px-2 text-[13px] font-medium text-foreground hover:bg-muted xl:inline-flex"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initial}
                    </span>
                    <span className="max-w-[90px] truncate">{firstName}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-border bg-popover">
                  <div className="border-b border-border px-2 py-1.5">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {displayName || profile?.full_name || 'My account'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                    <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {accountLabel}
                    </span>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to={dashboardLink} className="flex cursor-pointer items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={profilePath} className="flex cursor-pointer items-center gap-2">
                      <User className="h-4 w-4" aria-hidden="true" /> Profile & settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings/delete-account" className="flex cursor-pointer items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" /> Delete account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleSignOut();
                    }}
                    disabled={isSigningOut}
                    className="flex cursor-pointer items-center gap-2 font-medium text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-sm font-semibold xl:hidden">
                <Link to="/login">Sign In</Link>
              </Button>
              <div className="hidden items-center gap-2 xl:flex">
                <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-sm font-semibold">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className={cn('h-9 px-4 text-sm', PRIMARY_BUTTON)}>
                  <Link to="/register">Join Free</Link>
                </Button>
              </div>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 xl:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(320px,88vw)] flex-col gap-0 overflow-hidden border-border bg-background p-0"
            >
              <div className="border-b border-border px-4 py-3">
                <BrandLogo size="sm" variant="auto" linkTo="/" />
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
                <MobileNavSection title="Marketplace" items={PRIMARY_NAV} onNavigate={closeMenu} />
                <MobileNavSection title="Trade tools" items={TRADE_TOOLS} onNavigate={closeMenu} />
                <MobileNavSection title="Resources" items={RESOURCES} onNavigate={closeMenu} />
                <MobileNavSection title="Buyers" items={buyerItems} onNavigate={closeMenu} />
                <MobileNavSection title="Suppliers" items={supplierItems} onNavigate={closeMenu} />
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Country, language and theme
                  </p>
                  <LocaleControls variant="full" className="items-stretch" />
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="h-10 w-full justify-center gap-2 font-semibold text-primary"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-border p-4">
                {user ? (
                  <>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {displayName || profile?.full_name || 'My account'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button asChild variant="outline" className="h-11 w-full font-semibold text-primary">
                      <Link to={dashboardLink} onClick={closeMenu}>
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleSignOut()}
                      className="h-11 w-full font-semibold text-destructive"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className={cn('h-11 w-full', PRIMARY_BUTTON)}>
                      <Link to="/register" onClick={closeMenu}>Join Free</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 w-full font-semibold text-primary">
                      <Link to="/login" onClick={closeMenu}>Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile and tablet search */}
      {searchOpen && (
        <form role="search" onSubmit={submitSearch} className="border-t border-border px-4 py-2.5 sm:px-6 xl:hidden">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-muted px-3 focus-within:border-primary/60">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input
              id="header-search"
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products, suppliers, categories"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <Button type="submit" size="sm" className={cn('h-8 px-3', PRIMARY_BUTTON)}>
              Search
            </Button>
          </div>
        </form>
      )}

      {/* Mobile and tablet category navigation */}
      {categories.data && categories.data.length > 0 && (
        <nav aria-label="Browse categories" className="border-t border-border xl:hidden">
          <ul className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            <li className="shrink-0">
              <Link
                to="/categories"
                className="inline-flex whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                All categories
              </Link>
            </li>
            {categories.data.slice(0, 10).map((category) => (
              <li key={category.id} className="shrink-0">
                <Link
                  to={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="inline-flex whitespace-nowrap rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground hover:border-primary/50 hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
