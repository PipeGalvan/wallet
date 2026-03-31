import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  ),
);
