import { useEffect, useState } from 'react';
import { reportesApi } from '../api/reportes';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';

export default function Informes() {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any>(null);
  const [saldos, setSaldos] = useState<any[]>([]);
  const [facturasPend, setFacturasPend] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    fechaDesde: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    fechaHasta: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [resRes, salRes, fpRes] = await Promise.all([
        reportesApi.getResumen({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta }),
        reportesApi.getSaldos(),
        reportesApi.getFacturasPendientes(),
      ]);
      setResumen((resRes.data as any)?.data || resRes.data);
      const saldosData = (salRes.data as any)?.data || salRes.data;
      setSaldos(Array.isArray(saldosData) ? saldosData : saldosData?.data || []);
      const fpData = (fpRes.data as any)?.data || fpRes.data;
      setFacturasPend(Array.isArray(fpData) ? fpData : fpData?.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleFiltrar = () => { loadAll(); };

  if (loading) return <Spinner />;

  const resumenData = resumen?.data || resumen;
  const ingresos = resumenData?.ingresos || resumenData?.totalIngresos || 0;
  const egresos = resumenData?.egresos || resumenData?.totalEgresos || 0;
  const balance = Number(ingresos) - Number(egresos);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Informes</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Input label="Desde" type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })} />
        <Input label="Hasta" type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })} />
        <div className="flex items-end">
          <button onClick={handleFiltrar} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Filtrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-lg"><TrendingUp size={24} className="text-emerald-600" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Ingresos</p>
              <p className="text-xl font-bold text-emerald-600">{formatMoney(Number(ingresos))}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><TrendingDown size={24} className="text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Egresos</p>
              <p className="text-xl font-bold text-red-600">{formatMoney(Number(egresos))}</p>
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
