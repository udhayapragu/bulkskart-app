import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCountry } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

/** Only English has copy today. Other languages are listed as coming soon, not as switchable. */
const LANGUAGES = [
  { code: 'en', label: 'English', available: true },
  { code: 'hi', label: 'हिन्दी · Hindi', available: false },
  { code: 'ar', label: 'العربية · Arabic', available: false },
  { code: 'zh', label: '中文 · Chinese', available: false },
  { code: 'es', label: 'Español · Spanish', available: false },
  { code: 'de', label: 'Deutsch · German', available: false },
];

interface LocaleControlsProps {
  /** Compact keeps the header small. Full shows names, for the mobile menu and the footer. */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LocaleControls({ variant = 'compact', className }: LocaleControlsProps) {
  const { countryConfig, setCountry, availableCountries } = useCountry();
  const full = variant === 'full';
  const triggerClass = cn('h-8 gap-1.5 px-2 text-xs font-semibold text-foreground', full && 'h-10 px-3');

  return (
    <div className={cn('flex items-center gap-1', full && 'flex-wrap gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={full ? 'outline' : 'ghost'}
            size="sm"
            aria-label={`Country and currency, currently ${countryConfig.name}`}
            className={triggerClass}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {countryConfig.flag}
            </span>
            <span>{full ? countryConfig.name : countryConfig.code}</span>
            <span className="font-mono text-muted-foreground">{countryConfig.currency}</span>
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto border-border bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Country and currency</DropdownMenuLabel>
          {availableCountries.map((country) => {
            const selected = country.code === countryConfig.code;
            return (
              <DropdownMenuItem
                key={country.code}
                onSelect={() => setCountry(country.code)}
                className={cn('gap-2.5 py-2 text-xs', selected && 'font-semibold text-primary')}
              >
                <span aria-hidden="true" className="text-base">
                  {country.flag}
                </span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className="font-mono text-muted-foreground">
                  {country.symbol} {country.currency}
                </span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={full ? 'outline' : 'ghost'}
            size="sm"
            aria-label="Language, currently English"
            className={triggerClass}
          >
            <span>EN</span>
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 border-border bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Language</DropdownMenuLabel>
          {LANGUAGES.map((language) => (
            <DropdownMenuItem key={language.code} disabled={!language.available} className="gap-2 text-xs">
              <span className="flex-1">{language.label}</span>
              {language.available ? (
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              ) : (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Soon
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
