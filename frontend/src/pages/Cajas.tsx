import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cajasApi } from '../api/cajas';
import { movimientosRecurrentesApi } from '../api/movimientos-recurrentes';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Wallet, AlertTriangle } from 'lucide-react';

interface CajaWithSaldo {
  id: number;
  nombre: string;
  activo: boolean;
  saldos: { monedaId: number; moneda: string; saldo: number }[];
}

export default function Cajas() {
  const [cajas, setCajas] = useState<CajaWithSaldo[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCajas();
    loadPendientes();
  }, []);

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
      // cajas load failed — show empty state
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          <Wallet size={28} className="inline-block mr-2 -mt-1 text-primary-600" />
          Mis Cajas
        </h1>
      </div>

      {/* Pendientes recurrentes banner */}
      {pendingCount !== null && pendingCount > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Tenés {pendingCount} movimiento{pendingCount !== 1 ? 's' : ''} recurrente{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/movimientos-recurrentes')}
            className="whitespace-nowrap rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Ver Pendientes
          </button>
        </div>
      )}

      {/* Total balance summary across all cajas */}
      {cajas.length > 0 && (() => {
        const totals: Record<number, number> = {};
        for (const caja of cajas) {
          if (caja.saldos) {
            for (const s of caja.saldos) {
              totals[s.monedaId] = (totals[s.monedaId] || 0) + s.saldo;
            }
          }
        }
        const currencyIds = Object.keys(totals).map(Number);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {currencyIds.map((monId) => {
              const symbol = MONEDA_SYMBOLS[monId] || '$';
              const total = totals[monId];
              const isPositive = total >= 0;
              return (
                <Card key={monId} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <Wallet size={24} className={isPositive ? 'text-emerald-600' : 'text-red-600'} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total {symbol}</p>
                      <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatMoney(total, symbol)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })()}

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
