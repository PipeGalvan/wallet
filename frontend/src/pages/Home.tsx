import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cajasApi } from '../api/cajas';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { ArrowDownCircle, ArrowUpCircle, Repeat } from 'lucide-react';
import Button from '../components/ui/Button';
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
  const navigate = useNavigate();
  const tenantId = useAuthStore((s) => s.tenantId);

  useEffect(() => {
    setLoading(true);
    loadCajas();
  }, [tenantId]);

  const loadCajas = async () => {
    try {
      const { data } = await cajasApi.getAll();
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="success" onClick={() => navigate('/ingresos?new=true')}>
            <ArrowDownCircle size={16} className="mr-1" /> Ingreso
          </Button>
          <Button variant="danger" onClick={() => navigate('/egresos?new=true')}>
            <ArrowUpCircle size={16} className="mr-1" /> Egreso
          </Button>
          <Button variant="secondary" onClick={() => {}}>
            <Repeat size={16} className="mr-1" /> Transferir
          </Button>
        </div>
      </div>

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
