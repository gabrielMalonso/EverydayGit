import React, { useEffect, useMemo, useState } from 'react';
import { SelectMenu, SelectOption } from './SelectMenu';

export interface PhoneChangePayload {
  displayValue: string;
  digits: string;
  country: string;
}

export interface PhoneInputProps {
  id?: string;
  label?: string;
  countryLabel?: string;
  numberLabel?: string;
  value?: string;
  country?: string;
  onChange: (payload: PhoneChangePayload) => void;
  onCountryChange?: (country: string) => void;
  allowedCountries?: string[];
  placeholders?: Record<string, string>;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const COUNTRY_FLAG: Record<string, string> = {
  BR: '🇧🇷',
  US: '🇺🇸',
};

const normalizeCountry = (country?: string) => (country || 'US').toUpperCase();

const formatDigitsForCountry = (digits: string, country: string) => {
  const cleaned = digits.replace(/\D/g, '');
  if (country === 'BR') {
    const limited = cleaned.slice(0, 11);
    const ddd = limited.slice(0, 2);
    const prefix = limited.slice(2, 7);
    const suffix = limited.slice(7, 11);
    if (limited.length <= 2) return ddd;
    if (limited.length <= 7) return `(${ddd}) ${prefix}`;
    return `(${ddd}) ${prefix}-${suffix}`;
  }
  // default US
  const limited = cleaned.slice(0, 10);
  const area = limited.slice(0, 3);
  const first = limited.slice(3, 6);
  const last = limited.slice(6, 10);
  if (limited.length <= 3) return area;
  if (limited.length <= 6) return `(${area}) ${first}`;
  return `(${area}) ${first}-${last}`;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'phone-input',
  label,
  countryLabel,
  numberLabel,
  value = '',
  country = 'US',
  onChange,
  onCountryChange,
  allowedCountries = ['US', 'BR'],
  placeholders = {},
  error,
  disabled = false,
  className = '',
}) => {
  const normalizedCountry = normalizeCountry(country);
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  useEffect(() => {
    setInternalValue((prev) => {
      if (!prev) return prev;
      return formatDigitsForCountry(prev, normalizedCountry);
    });
  }, [normalizedCountry]);

  const selectOptions: SelectOption[] = useMemo(
    () =>
      allowedCountries.map((code) => ({
        value: code,
        label: `${COUNTRY_FLAG[code] ?? ''} ${code}`,
      })),
    [allowedCountries],
  );

  const placeholder =
    placeholders[normalizedCountry] ??
    (normalizedCountry === 'BR' ? '(11) 98888-7777' : '(415) 555-0199');

  const handleCountryChange = (nextCountry: string) => {
    const next = normalizeCountry(nextCountry);
    onCountryChange?.(next);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value || '';
    const digits = raw.replace(/\D/g, '');
    const formatted = formatDigitsForCountry(digits, normalizedCountry);
    setInternalValue(formatted);
    onChange({
      displayValue: formatted,
      digits,
      country: normalizedCountry,
    });
  };

  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-text2">{label}</p>}
      <div className="mt-2 flex items-start gap-3">
        <div className="w-28">
          {countryLabel && <label className="text-xs font-medium uppercase tracking-wide text-text3">{countryLabel}</label>}
          <SelectMenu
            id={`${id}-country`}
            value={normalizedCountry}
            options={selectOptions}
            onChange={(nextValue) => handleCountryChange(String(nextValue))}
            buttonClassName="mt-1 w-full rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] flex items-center disabled:bg-surface1 disabled:text-text3 disabled:cursor-not-allowed"
            buttonContentClassName="flex min-w-0 flex-1 truncate"
            menuWidthClass="w-44"
            menuClassName="bg-surface2"
            renderTriggerValue={(option) => option?.label ?? normalizedCountry}
            renderOptionLabel={(option) => option.label}
            ariaLabel={countryLabel || label}
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          {numberLabel && (
            <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-text3">
              {numberLabel}
            </label>
          )}
          <input
            id={id}
            type="tel"
            inputMode="tel"
            className={`mt-1 w-full rounded-input border border-border1 bg-surface2 px-4 py-2.5 text-sm text-text1 placeholder:text-text3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] disabled:bg-surface1 disabled:text-text3 disabled:cursor-not-allowed transition-colors ${
              error ? 'border-danger focus-visible:ring-danger' : ''
            }`}
            value={internalValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            disabled={disabled}
          />
          {error && (
            <div id={errorId} className="mt-2 flex items-center text-sm text-danger">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-danger" aria-hidden />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneInput;
