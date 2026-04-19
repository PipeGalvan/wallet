import { useEffect, useState } from 'react';
import { reportesApi } from '../api/reportes';
import Card from '../components/ui/Card';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

function trendInfo(current: number, prev: number): { pct: string; direction: 'up' | 'down' | 'flat' | 'none' } {
  if (prev === 0 && current === 0) return { pct: '', direction: 'none' };
  if (prev === 0) return { pct: '\u2014', direction: 'none' };
  const pctVal = ((current - prev) / prev) * 100;
  if (pctVal > 0) return { pct: `\u2191${pctVal.toFixed(1)}%`, direction: 'up' };
  if (pctVal < 0) return { pct: `\u2193${Math.abs(pctVal).toFixed(1)}%`, direction: 'down' };
  return { pct: '0.0%', direction: 'flat' };
}

function generateMonthRange(meses: number): { mes: string; label: string }[] {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const months: { mes: string; label: string }[] = [];
  const now = new Date();
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    months.push({ mes, label });
  }
  return months;
}

function aggregateByCurrency(items: any[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const item of items) {
    const mid = Number(item.monedaId);
    result[mid] = (result[mid] || 0) + Number(item.total);
  }
  return result;
}

interface LineChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; dataKey: string }>;
  label?: string;
}

function EvolutionTooltip({ active, payload, label }: LineChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const colorMap: Record<string, string> = {
    ingresos: '#10b981',
    egresos: '#ef4444',
    balance: '#3b82f6',
  };
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: colorMap[entry.dataKey] || '#666' }}>
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function Home() {
  const [resumen, setResumen] = useState<any>(null);
  const [prevResumen, setPrevResumen] = useState<any>(null);
  const [evolucion, setEvolucion] = useState<any[]>([]);
  const [evolucionError, setEvolucionError] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriasIngresos, setCategoriasIngresos] = useState<any[]>([]);
  const tenantId = useAuthStore((s) => s.tenantId);

  useEffect(() => {
    loadResumen();
    loadCategorias();
  }, [tenantId]);

  const loadResumen = async () => {
    try {
      const current = getMonthRange();
      const prev = getPrevMonthRange();
      const [currentRes, prevRes, evoRes] = await Promise.all([
        reportesApi.getResumen(current),
        reportesApi.getResumen(prev),
        reportesApi.getEvolucionMensual({ meses: 6 }),
      ]);
      setResumen((currentRes.data as any)?.data || currentRes.data);
      setPrevResumen((prevRes.data as any)?.data || prevRes.data);

      // Merge evolution data with generated months
      const evoData = (evoRes.data as any)?.data || evoRes.data;
      const apiMonths: any[] = Array.isArray(evoData?.meses) ? evoData.meses : Array.isArray(evoData) ? evoData : [];
      const allMonths = generateMonthRange(6);
      const merged = allMonths.map((m) => {
        const found = apiMonths.find((d: any) => d.mes === m.mes);
        return found || { ...m, monedaId: 1, ingresos: 0, egresos: 0, balance: 0 };
      });
      setEvolucion(merged);
      setEvolucionError(false);
    } catch {
      setEvolucionError(true);
    }
  };

  const loadCategorias = async () => {
    try {
      const current = getMonthRange();
      const { data } = await reportesApi.getAgrupadoPorTipo(current);
      const agrData = (data as any)?.data || data;

      // Top 5 Egresos
      const egresos: any[] = Array.isArray(agrData?.egresos) ? agrData.egresos : [];
      const topEgresos = egresos
        .filter((item: any) => Number(item.monedaId) === 1)
        .filter((item: any) => !item.esTransferencia && !item.esCambio)
        .sort((a: any, b: any) => Number(b.total) - Number(a.total))
        .slice(0, 5);
      setCategorias(topEgresos);

      // Top 5 Ingresos
      const ingresos: any[] = Array.isArray(agrData?.ingresos) ? agrData.ingresos : [];
      const topIngresos = ingresos
        .filter((item: any) => Number(item.monedaId) === 1)
        .filter((item: any) => !item.esTransferencia && !item.esCambio)
        .sort((a: any, b: any) => Number(b.total) - Number(a.total))
        .slice(0, 5);
      setCategoriasIngresos(topIngresos);
    } catch {
      setCategorias([]);
      setCategoriasIngresos([]);
    }
  };

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

  const renderTrend = (trend: { pct: string; direction: string }) => {
    if (!trend.pct) return null;
    const colorClass =
      trend.direction === 'up' ? 'text-emerald-500' :
      trend.direction === 'down' ? 'text-red-500' :
      'text-gray-400';
    return <span className={`${colorClass} text-xs font-medium`}>{trend.pct}</span>;
  };

  const renderMultiValue = (values: Record<number, number>, prevValues: Record<number, number>) => {
    if (displayCurrencies.length === 1) {
      const monId = displayCurrencies[0];
      const symbol = MONEDA_SYMBOLS[monId] || '$';
      const val = values[monId] || 0;
      return { main: formatMoney(val, symbol), trend: trendInfo(val, prevValues[monId] || 0) };
    }
    // Multi-currency: show each
    const parts = displayCurrencies.map((monId) => {
      const symbol = MONEDA_SYMBOLS[monId] || '$';
      return formatMoney(values[monId] || 0, symbol);
    });
    const totalARS = values[1] || 0;
    return { main: parts.join(' / '), trend: trendInfo(totalARS, prevValues[1] || 0) };
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

  // Filter ARS-only evolucion data for chart
  const evolucionARS = evolucion.filter((d: any) => (d.monedaId === 1 || !d.monedaId));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
      </div>

      {/* Monthly Summary Cards — Enhanced with 1-decimal trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-lg"><TrendingUp size={24} className="text-emerald-600" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos (mes)</p>
              <p className="text-2xl font-bold text-emerald-600">{ingDisplay.main}</p>
              <div className="mt-0.5">{renderTrend(ingDisplay.trend)}</div>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><TrendingDown size={24} className="text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Egresos (mes)</p>
              <p className="text-2xl font-bold text-red-600">{egDisplay.main}</p>
              <div className="mt-0.5">{renderTrend(egDisplay.trend)}</div>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${balPositive ? 'bg-blue-100' : 'bg-amber-100'}`}>
              <Wallet size={24} className={balPositive ? 'text-blue-600' : 'text-amber-600'} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance (mes)</p>
              <p className={`text-2xl font-bold ${balPositive ? 'text-blue-600' : 'text-amber-600'}`}>{balDisplay.main}</p>
              <div className="mt-0.5">{renderTrend(balDisplay.trend)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Evolution LineChart */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Evolución Mensual
        </h2>
        <div className="h-72">
          {evolucionError ? (
            <div className="flex items-center justify-center h-full text-red-400 text-sm">
              Error al cargar la evolución mensual
            </div>
          ) : evolucionARS.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
              No hay datos en ARS
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucionARS} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip content={<EvolutionTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Top 5 Categories — Ingresos & Egresos side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Top 5 Ingresos del Mes
          </h2>
          {categoriasIngresos.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {categoriasIngresos.map((cat: any, idx: number) => (
                <div key={cat.tipoId || idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.tipoNombre}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{formatMoney(Number(cat.total))}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Top 5 Egresos del Mes
          </h2>
          {categorias.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {categorias.map((cat: any, idx: number) => (
                <div key={cat.tipoId || idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.tipoNombre}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{formatMoney(Number(cat.total))}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
