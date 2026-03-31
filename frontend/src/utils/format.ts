export function formatMoney(amount: number, currency: string = '$'): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency} ${formatted}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
