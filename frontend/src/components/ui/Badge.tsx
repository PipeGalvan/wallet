interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

const variants = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
