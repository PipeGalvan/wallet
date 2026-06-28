import { useState } from 'react';
import { Bell, BellOff, BellRing, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { usePushSubscription } from '../../hooks/usePushSubscription';
import { pushApi } from '../../api/push';
import { useAuthStore } from '../../store/authStore';

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
  const isAdmin = useAuthStore((s) => s.user?.isAdmin === true);
  const [testing, setTesting] = useState(false);

  const status = resolveStatus(permission, subscribed);
  const { label, icon: Icon, tone } = STATUS_META[status];

  // Admin-only: manually trigger the daily reminders cron for testing.
  const handleTestTrigger = async () => {
    setTesting(true);
    try {
      const { data } = await pushApi.triggerReminders();
      // Response envelope: { success, data: { sent, pruned, totalSubscriptions } }
      const result = data?.data ?? data;
      toast.success(
        `Procesado: ${result.sent} enviada(s), ${result.pruned} podada(s), ${result.totalSubscriptions} suscripción(es)`,
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          'Error al disparar recordatorios',
      );
    } finally {
      setTesting(false);
    }
  };

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

      {isAdmin && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Herramientas admin
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Disparar manualmente el cron de recordatorios (no espera a las
              09:00). Útil para probar que el flujo push funciona en este
              dispositivo.
            </p>
          </div>
          <Button
            onClick={handleTestTrigger}
            loading={testing}
            variant="secondary"
          >
            <Send size={16} className="mr-1" />
            Probar notificación
          </Button>
        </div>
      )}
    </div>
  );
}
