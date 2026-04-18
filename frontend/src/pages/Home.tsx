import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cajasApi } from '../api/cajas';
import { movimientosRecurrentesApi } from '../api/movimientos-recurrentes';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

interface CajaWithSaldo {
  id: number;
  nombre: string;
  activo: boolean;
  saldos: { monedaId: number; moneda: string; saldo: number }[];
}

export default function Home() {
  const [cajas, setCajas] = useState<CajaWithSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const tenantId = useAuthStore((s) => s.tenantId);

  useEffect(() => {
    setLoading(true);
    loadCajas();
    loadPendientes();
  }, [tenantId]);

  const loadPendientes = async () => {
    try {
      const { data } = await movimientosRecurrentesApi.getPendientes();
      const items = (data as any).data || data;
      setPendingCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setPendingCount(null);
    }
  };

  const loadCajas = async () => {
    try {
      const { data } = await cajasApi.getAll({ activo: true });
      setCajas((data as any).data || data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mis Cajas</h1>
      </div>

      {pendingCount !== null && pendingCount > 0 && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Tenés {pendingCount} movimiento{pendingCount !== 1 ? 's' : ''} recurrente{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => navigate('/movimientos-recurrentes')}
            className="whitespace-nowrap rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Ver Pendientes
          </button>
        </div>
      )}

      {cajas.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400">No hay cajas configuradas</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cajas.map((caja) => (
            <Card key={caja.id} onClick={() => navigate(`/cajas/${caja.id}`)}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{caja.nombre}</h3>
              {caja.saldos && caja.saldos.length > 0 ? (
                <div className="space-y-1">
                  {caja.saldos.map((s) => (
                    <div key={s.monedaId} className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{s.moneda}</span>
                      <span className={`font-semibold ${s.saldo > 0 ? 'text-emerald-600' : s.saldo < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {formatMoney(s.saldo, MONEDA_SYMBOLS[s.monedaId] || s.moneda)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin movimientos</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
