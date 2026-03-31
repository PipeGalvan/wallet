import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { MONEDA_SYMBOLS } from '../../utils/constants';

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  monedaId?: number;
  onChange?: (value: number) => void;
}

export default forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ label, error, monedaId, onChange, className = '', ...props }, ref) => {
    const [display, setDisplay] = useState(props.value?.toString() || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9.,]/g, '');
      setDisplay(val);
      const num = parseFloat(val.replace(',', '.')) || 0;
      onChange?.(num);
    };

    return (
      <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{label}</label>}
        <div className="relative">
          {monedaId && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
              {MONEDA_SYMBOLS[monedaId] || '$'}
            </span>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={display}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 ${
              monedaId ? 'pl-10' : ''
            } ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);
