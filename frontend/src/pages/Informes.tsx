import { useEffect, useState, useCallback } from 'react';
import { reportesApi } from '../api/reportes';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { TrendingUp, TrendingDown, Wallet, FileText, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const DEFAULT_DATE_FROM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
const DEFAULT_DATE_TO = new Date().toISOString().split('T')[0];

interface AgrupadoItem {
  tipoId: number;
  tipoNombre: string;
  monedaId: number;
  total: string;
}

interface ResumenItem {
  monedaId: number;
  total: string;
}

interface ChartsData {
  barData: { name: string; ingresos: number; egresos: number }[];
  pieIngresos: { name: string; value: number; monedaId: number }[];
  pieEgresos: { name: string; value: number; monedaId: number }[];
}

function buildChartData(
  resumenIngresos: ResumenItem[],
  resumenEgresos: ResumenItem[],
  agrupadoIngresos: AgrupadoItem[],
  agrupadoEgresos: AgrupadoItem[],
): ChartsData {
  // Bar chart: one entry per currency showing total ingresos vs egresos
  const currencySet = new Set<number>();
  resumenIngresos.forEach((i) => currencySet.add(i.monedaId));
  resumenEgresos.forEach((e) => currencySet.add(e.monedaId));

  const barData = Array.from(currencySet).map((monedaId) => {
    const ing = resumenIngresos.find((i) => i.monedaId === monedaId);
    const egr = resumenEgresos.find((e) => e.monedaId === monedaId);
    const symbol = MONEDA_SYMBOLS[monedaId] || '$';
    return {
      name: symbol,
      ingresos: Number(ing?.total || 0),
      egresos: Number(egr?.total || 0),
    };
  });

  // Pie charts: aggregate by tipoNombre, grouping across currencies
  const aggregateByTipo = (items: AgrupadoItem[]): { name: string; value: number; monedaId: number }[] => {
    const map = new Map<string, { value: number; monedaId: number }>();
    items.forEach((item) => {
      const key = item.tipoNombre;
      const existing = map.get(key);
      if (existing) {
        existing.value += Number(item.total);
      } else {
        map.set(key, { value: Number(item.total), monedaId: item.monedaId });
      }
    });
    return Array.from(map.entries()).map(([name, val]) => ({
      name,
      value: Math.round(val.value * 100) / 100,
      monedaId: val.monedaId,
    }));
  };

  return {
    barData,
    pieIngresos: aggregateByTipo(agrupadoIngresos),
    pieEgresos: aggregateByTipo(agrupadoEgresos),
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    payload?: { name: string };
  }>;
  label?: string;
}

function BarChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.dataKey === 'ingresos' ? '#10b981' : '#ef4444' }}>
          {entry.name}: {formatMoney(entry.value, label || '$')}
        </p>
      ))}
    </div>
  );
}

function PieChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0] as { name: string; value: number; payload?: { name: string; value: number; monedaId: number } };
  const monedaId = item.payload?.monedaId || 1;
  const symbol = MONEDA_SYMBOLS[monedaId] || '$';
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200">{item.name}</p>
      <p className="text-gray-600 dark:text-gray-300">{formatMoney(item.value, symbol)}</p>
    </div>
  );
}

function EmptyChartMessage() {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
      No hay datos para el período seleccionado
    </div>
  );
}

export default function Informes() {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any>(null);
  const [saldos, setSaldos] = useState<any[]>([]);
  const [facturasPend, setFacturasPend] = useState<any[]>([]);
  const [agrupado, setAgrupado] = useState<{ ingresos: AgrupadoItem[]; egresos: AgrupadoItem[] }>({ ingresos: [], egresos: [] });
  const [filtros, setFiltros] = useState({
    fechaDesde: DEFAULT_DATE_FROM,
    fechaHasta: DEFAULT_DATE_TO,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta };
      const [resRes, salRes, fpRes, agrRes] = await Promise.all([
        reportesApi.getResumen(params),
        reportesApi.getSaldos(),
        reportesApi.getFacturasPendientes(),
        reportesApi.getAgrupadoPorTipo(params),
      ]);
      setResumen((resRes.data as any)?.data || resRes.data);
      const saldosData = (salRes.data as any)?.data || salRes.data;
      setSaldos(Array.isArray(saldosData) ? saldosData : saldosData?.data || []);
      const fpData = (fpRes.data as any)?.data || fpRes.data;
      setFacturasPend(Array.isArray(fpData) ? fpData : fpData?.data || []);
      const agrData = (agrRes.data as any)?.data || agrRes.data;
      setAgrupado({
        ingresos: Array.isArray(agrData?.ingresos) ? agrData.ingresos : [],
        egresos: Array.isArray(agrData?.egresos) ? agrData.egresos : [],
      });
    } catch {
      // errors handled by API interceptor
    } finally {
      setLoading(false);
    }
  }, [filtros.fechaDesde, filtros.fechaHasta]);

  useEffect(() => { loadAll(); }, []);

  const handleFiltrar = () => { loadAll(); };

  if (loading) return <Spinner />;

  const resumenData = resumen?.data || resumen;
  const resumenIngresos: ResumenItem[] = Array.isArray(resumenData?.ingresos) ? resumenData.ingresos : [];
  const resumenEgresos: ResumenItem[] = Array.isArray(resumenData?.egresos) ? resumenData.egresos : [];
  const totalIngresos = resumenIngresos.reduce((sum, i) => sum + Number(i.total), 0);
  const totalEgresos = resumenEgresos.reduce((sum, e) => sum + Number(e.total), 0);
  const balance = totalIngresos - totalEgresos;

  const charts = buildChartData(resumenIngresos, resumenEgresos, agrupado.ingresos, agrupado.egresos);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Informes</h1>

      {/* Date Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Input label="Desde" type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })} />
        <Input label="Hasta" type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })} />
        <div className="flex items-end">
          <button onClick={handleFiltrar} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Filtrar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-lg"><TrendingUp size={24} className="text-emerald-600" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Ingresos</p>
              <p className="text-xl font-bold text-emerald-600">{formatMoney(totalIngresos)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><TrendingDown size={24} className="text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Egresos</p>
              <p className="text-xl font-bold text-red-600">{formatMoney(totalEgresos)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
              <Wallet size={24} className={balance >= 0 ? 'text-blue-600' : 'text-amber-600'} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{formatMoney(balance)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bar Chart: Ingresos vs Egresos by Currency */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <BarChart3 size={18} /> Ingresos vs Egresos por Moneda
        </h2>
        <div className="h-72">
          {charts.barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v: number) => `${v}`} />
                <Tooltip content={<BarChartTooltip />} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage />
          )}
        </div>
      </Card>

      {/* Pie Charts: Breakdown by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <PieChartIcon size={18} /> Ingresos por Tipo
          </h2>
          <div className="h-72">
            {charts.pieIngresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pieIngresos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name.length > 15 ? name.slice(0, 15) + '…' : name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {charts.pieIngresos.map((_entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieChartTooltip />} />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage />
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <PieChartIcon size={18} /> Egresos por Tipo
          </h2>
          <div className="h-72">
            {charts.pieEgresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pieEgresos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name.length > 15 ? name.slice(0, 15) + '…' : name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {charts.pieEgresos.map((_entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieChartTooltip />} />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage />
            )}
          </div>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Wallet size={18} /> Saldos por Caja
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Caja</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((s: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3">{s.CajaNombre || s.nombre || s.caja?.nombre || '-'}</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {formatMoney(Number(s.saldo || s.Saldo || 0), MONEDA_SYMBOLS[s.MonedaId || s.monedaId] || '$')}
                    </td>
                  </tr>
                ))}
                {saldos.length === 0 && (
                  <tr><td colSpan={2} className="py-6 text-center text-gray-400 dark:text-gray-500">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <FileText size={18} /> Facturas Pendientes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Cliente</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {facturasPend.map((f: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3">{f.cliente?.ClienteNombre || f.cliente?.nombre || '-'}</td>
                    <td className="py-2 px-3 text-right font-semibold text-amber-600">
                      {formatMoney(Number(f.FacturaSaldo || f.saldo || 0), MONEDA_SYMBOLS[f.MonedaId || f.monedaId] || '$')}
                    </td>
                  </tr>
                ))}
                {facturasPend.length === 0 && (
                  <tr><td colSpan={2} className="py-6 text-center text-gray-400 dark:text-gray-500">Sin facturas pendientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
