import { MONEDA_SYMBOLS } from '../../utils/constants';
import Badge from '../ui/Badge';

interface CurrencyBadgeProps {
  monedaId: number;
  monedaNombre?: string;
}

export default function CurrencyBadge({ monedaId, monedaNombre }: CurrencyBadgeProps) {
  const symbol = MONEDA_SYMBOLS[monedaId] || monedaNombre || '?';
  return <Badge variant={monedaId === 1 ? 'default' : 'info'}>{symbol}</Badge>;
}
