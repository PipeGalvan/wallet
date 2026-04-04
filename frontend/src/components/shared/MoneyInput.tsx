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

function parseFormatted(val: string): number {
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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
