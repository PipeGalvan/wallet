import { useEffect, useState } from 'react';
import { egresosApi } from '../api/egresos';
import { cajasApi } from '../api/cajas';
import { catalogosApi } from '../api/catalogos';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Egresos() {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  const [tiposEgreso, setTiposEgreso] = useState<any[]>([]);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoEgresoId: '',
    observacion: '',
    monedaId: '1',
    importe: '',
    cajaId: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [egRes, cajasRes, tiposRes] = await Promise.all([
        egresosApi.getAll({ page: 1, limit: 100 }),
        cajasApi.getAll(),
        catalogosApi.getTiposEgreso(),
      ]);
      const egData = egRes.data as any;
      setEgresos(egData.data?.data || egData.data || []);
      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
      setTiposEgreso(tiposRes.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await egresosApi.create({
        fecha: form.fecha,
        tipoEgresoId: parseInt(form.tipoEgresoId),
        observacion: form.observacion,
        monedaId: parseInt(form.monedaId),
        importe: parseFloat(form.importe),
        cajaId: parseInt(form.cajaId),
      });
      toast.success('Egreso registrado');
      setShowModal(false);
      setForm({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', observacion: '', monedaId: '1', importe: '', cajaId: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al registrar egreso');
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (e: any) => formatDate(e.EgresoFecha || e.fecha) },
    { key: 'tipo', header: 'Tipo', render: (e: any) => e.tipoEgreso?.TipoEgresoNombre || e.tipoEgreso?.nombre || '-' },
    { key: 'observacion', header: 'Observacion', render: (e: any) => e.EgresoObservacion || e.observacion || '-' },
    { key: 'importe', header: 'Importe', render: (e: any) => {
      const imp = Number(e.EgresoImporte || e.importe);
      const monId = e.MonedaId || e.monedaId;
      return <span className="font-semibold text-red-600">{formatMoney(imp, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Egresos</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-1" /> Nuevo Egreso
        </Button>
      </div>

      <Card><Table columns={columns} data={egresos} /></Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Egreso">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <Select label="Tipo de Egreso" value={form.tipoEgresoId} onChange={(e) => setForm({ ...form, tipoEgresoId: e.target.value })}
            options={tiposEgreso.map((t: any) => ({ value: t.id || t.TipoEgresoId, label: t.nombre || t.TipoEgresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Caja" value={form.cajaId} onChange={(e) => setForm({ ...form, cajaId: e.target.value })}
            options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja" />
          <Select label="Moneda" value={form.monedaId} onChange={(e) => setForm({ ...form, monedaId: e.target.value })}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]} />
          <Input label="Importe" type="number" step="0.01" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} placeholder="0.00" />
          <Input label="Observacion" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} placeholder="Observacion (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="danger" loading={saving} onClick={handleCreate}>Registrar Egreso</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
