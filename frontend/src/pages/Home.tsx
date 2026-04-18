import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cajasApi } from '../api/cajas';
import { reportesApi } from '../api/reportes';
import { movimientosRecurrentesApi } from '../api/movimientos-recurrentes';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface CajaWithSaldo {
  id: number;
  nombre: string;
  activo: boolean;
  saldos: { monedaId: number; moneda: string; saldo: number }[];
}

function getMonthRange(date?: Date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const fechaDesde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const fechaHasta = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { fechaDesde, fechaHasta };
}

function getPrevMonthRange() {
  const prev = new Date();
  prev.setMonth(prev.getMonth() - 1);
  return getMonthRange(prev);
}

function trendLabel(current: number, prev: number) {
  if (prev === 0 && current === 0) return null;
  if (prev === 0) return <span className="text-emerald-500 text-xs font-medium">Nuevo</span>;
  const pct = ((current - prev) / prev) * 100;
  if (pct > 0) return <span className="text-emerald-500 text-xs font-medium">↑ {pct.toFixed(0)}%</span>;
  if (pct < 0) return <span className="text-red-500 text-xs font-medium">↓ {Math.abs(pct).toFixed(0)}%</span>;
  return <span className="text-gray-400 text-xs font-medium">=</span>;
}

function aggregateByCurrency(items: any[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const item of items) {
    const mid = Number(item.monedaId);
    result[mid] = (result[mid] || 0) + Number(item.total);
  }
  return result;
}

export default function Home() {
  const [cajas, setCajas] = useState<CajaWithSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [resumen, setResumen] = useState<any>(null);
  const [prevResumen, setPrevResumen] = useState<any>(null);
  const navigate = useNavigate();
  const tenantId = useAuthStore((s) => s.tenantId);

  useEffect(() => {
    setLoading(true);
    loadCajas();
    loadPendientes();
    loadResumen();
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

  const loadResumen = async () => {
    try {
      const current = getMonthRange();
      const prev = getPrevMonthRange();
      const [currentRes, prevRes] = await Promise.all([
        reportesApi.getResumen(current),
        reportesApi.getResumen(prev),
      ]);
      setResumen((currentRes.data as any)?.data || currentRes.data);
      setPrevResumen((prevRes.data as any)?.data || prevRes.data);
    } catch {
      // handled by global interceptor
    }
  };

  if (loading) return <Spinner />;

  // Parse resumen data
  const currentData = resumen?.data || resumen;
  const prevData = prevResumen?.data || prevResumen;

  const currentIngresos = aggregateByCurrency(currentData?.ingresos || []);
  const currentEgresos = aggregateByCurrency(currentData?.egresos || []);
  const prevIngresos = aggregateByCurrency(prevData?.ingresos || []);
  const prevEgresos = aggregateByCurrency(prevData?.egresos || []);

  const currencies = Array.from(new Set([
    ...Object.keys(currentIngresos),
    ...Object.keys(currentEgresos),
  ])).map(Number);
  const displayCurrencies = currencies.length > 0 ? currencies : [1];

  const renderMultiValue = (values: Record<number, number>, prevValues: Record<number, number>) => {
    if (displayCurrencies.length === 1) {
      const monId = displayCurrencies[0];
      const symbol = MONEDA_SYMBOLS[monId] || '$';
      const val = values[monId] || 0;
      return { main: formatMoney(val, symbol), trend: trendLabel(val, prevValues[monId] || 0) };
    }
    // Multi-currency: show each
    const parts = displayCurrencies.map((monId) => {
      const symbol = MONEDA_SYMBOLS[monId] || '$';
      return `${symbol} ${(values[monId] || 0).toFixed(2)}`;
    });
    const totalARS = values[1] || 0;
    return { main: parts.join(' / '), trend: trendLabel(totalARS, prevValues[1] || 0) };
  };

  const ingDisplay = renderMultiValue(currentIngresos, prevIngresos);
  const egDisplay = renderMultiValue(currentEgresos, prevEgresos);
  const balanceByCurrency: Record<number, number> = {};
  const prevBalanceByCurrency: Record<number, number> = {};
  for (const monId of displayCurrencies) {
    balanceByCurrency[monId] = (currentIngresos[monId] || 0) - (currentEgresos[monId] || 0);
    prevBalanceByCurrency[monId] = (prevIngresos[monId] || 0) - (prevEgresos[monId] || 0);
  }
  const balDisplay = renderMultiValue(balanceByCurrency, prevBalanceByCurrency);
  const balPositive = Object.values(balanceByCurrency).every((v) => v >= 0);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mis Cajas</h1>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg"><TrendingUp size={24} className="text-emerald-600" /></div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos (mes)</p>
                <p className="text-xl font-bold text-emerald-600">{ingDisplay.main}</p>
              </div>
            </div>
            {ingDisplay.trend}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg"><TrendingDown size={24} className="text-red-600" /></div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Egresos (mes)</p>
                <p className="text-xl font-bold text-red-600">{egDisplay.main}</p>
              </div>
            </div>
            {egDisplay.trend}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${balPositive ? 'bg-blue-100' : 'bg-amber-100'}`}>
                <Wallet size={24} className={balPositive ? 'text-blue-600' : 'text-amber-600'} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Balance (mes)</p>
                <p className={`text-xl font-bold ${balPositive ? 'text-blue-600' : 'text-amber-600'}`}>{balDisplay.main}</p>
              </div>
            </div>
            {balDisplay.trend}
          </div>
        </Card>
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
