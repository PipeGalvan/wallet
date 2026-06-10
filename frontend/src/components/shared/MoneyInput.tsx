import { InputHTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  value: number;
  onChange?: (value: number) => void;
}

function formatDisplay(num: number): string {
  if (num === 0) return '';
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]}`;
}

/**
 * Smart number parser — accepts ALL these formats:
 *   "1.550.432,25"  →  1550432.25  (es-AR: . miles, , decimal)
 *   "1550432,25"     →  1550432.25  (, as decimal, no thousands)
 *   "1550432.25"     →  1550432.25  (. as decimal, no thousands)
 *   "1,550,432.25"   →  1550432.25  (en-US: , miles, . decimal)
 *   "1550432"        →  1550432     (plain integer)
 */
function parseFormatted(val: string): number {
  const trimmed = val.trim();
  if (!trimmed) return 0;

  const hasDot = trimmed.includes('.');
  const hasComma = trimmed.includes(',');

  // No separators at all — plain number
  if (!hasDot && !hasComma) {
    const num = parseFloat(trimmed);
    return isNaN(num) ? 0 : num;
  }

  // Only commas: determine if last comma is decimal or thousands
  if (hasComma && !hasDot) {
    const lastCommaIdx = trimmed.lastIndexOf(',');
    const afterComma = trimmed.slice(lastCommaIdx + 1);
    // If exactly 2 digits after last comma → treat as decimal (e.g. "1550432,25")
    if (afterComma.length === 2) {
      const cleaned = trimmed.replace(/,/g, '');
      const num = parseFloat(cleaned.slice(0, -2) + '.' + afterComma);
      return isNaN(num) ? 0 : num;
    }
    // Otherwise treat comma as thousands separator (e.g. "1,550,432")
    const cleaned = trimmed.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  // Only dots: determine if last dot is decimal or thousands
  if (hasDot && !hasComma) {
    const lastDotIdx = trimmed.lastIndexOf('.');
    const afterDot = trimmed.slice(lastDotIdx + 1);
    // If 2 or fewer digits after last dot → treat as decimal (e.g. "1550432.25")
    if (afterDot.length <= 2) {
      // Remove dots that are thousands separators (3 digits after them)
      // e.g. "1.550.432" → "1550432", but "1550432.25" stays as is (dot before 2 digits is decimal)
      const n = parseFloat(trimmed.replace(/\.(?=\d{3})/g, ''));
      return isNaN(n) ? 0 : n;
    }
    // 3+ digits after last dot → dots are thousands separators (e.g. "1.550.432000")
    const cleaned = trimmed.replace(/\./g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  // Both dot and comma present: whichever appears LAST is the decimal separator
  const lastDotIdx = trimmed.lastIndexOf('.');
  const lastCommaIdx = trimmed.lastIndexOf(',');

  if (lastCommaIdx > lastDotIdx) {
    // Comma is decimal (es-AR): "1.550.432,25"
    const cleaned = trimmed.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  } else {
    // Dot is decimal (en-US): "1,550,432.25"
    const cleaned = trimmed.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
}

export default forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ label, error, value, onChange, className = '', ...props }, ref) => {
    const [raw, setRaw] = useState(() => formatDisplay(value));
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    useEffect(() => {
      if (document.activeElement !== (inputRef as any)?.current) {
        setRaw(formatDisplay(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9.,]/g, '');
      setRaw(val);
      const num = parseFormatted(val);
      onChange?.(num);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (value !== 0) {
        setRaw(formatDisplay(value));
      } else {
        setRaw('');
      }
      props.onBlur?.(e);
    };

    return (
      <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{label}</label>}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);
