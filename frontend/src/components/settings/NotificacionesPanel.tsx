import { Bell, BellOff, BellRing, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { usePushSubscription } from '../../hooks/usePushSubscription';

type Status = 'unknown' | 'allowed' | 'blocked' | 'active';

function resolveStatus(
  permission: 'default' | 'granted' | 'denied',
  subscribed: boolean,
): Status {
  if (permission === 'denied') return 'blocked';
  if (subscribed) return 'active';
  if (permission === 'granted') return 'allowed';
  return 'unknown';
}

const STATUS_META: Record<
  Status,
  { label: string; icon: typeof Bell; tone: string }
> = {
  unknown: { label: 'Desconocido', icon: Bell, tone: 'text-gray-500' },
  allowed: { label: 'Permitido', icon: BellRing, tone: 'text-blue-500' },
  active: { label: 'Activo', icon: BellRing, tone: 'text-emerald-500' },
  blocked: { label: 'Bloqueado', icon: BellOff, tone: 'text-red-500' },
};

export default function NotificacionesPanel() {
  const { permission, subscribed, loading, subscribe, unsubscribe } =
    usePushSubscription();

  const status = resolveStatus(permission, subscribed);
  const { label, icon: Icon, tone } = STATUS_META[status];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon className={`${tone}`} size={20} />
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Notificaciones de recurrentes
          </p>
          <p className={`text-sm ${tone}`}>Estado: {label}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Recibí un recordatorio diario a las 09:00 cuando tengas movimientos
        recurrentes pendientes.
      </p>

      {status === 'blocked' && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Las notificaciones están bloqueadas para este sitio. Para
            reactivarlas, habilitá el permiso desde la configuración de tu
            navegador y volvé a esta pestaña.
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Only offer opt-in when not blocked — never re-prompt a denial. */}
        {status !== 'blocked' && (
          <Button
            onClick={subscribe}
            loading={loading}
            disabled={status === 'active'}
            variant={status === 'active' ? 'secondary' : 'primary'}
          >
            <BellRing size={16} className="mr-1" />
            {status === 'active' ? 'Activas' : 'Activar'}
          </Button>
        )}

        {status === 'active' && (
          <Button onClick={unsubscribe} loading={loading} variant="danger">
            <BellOff size={16} className="mr-1" />
            Desactivar
          </Button>
        )}
      </div>
    </div>
  );
}
