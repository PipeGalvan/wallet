import { useEffect, useState } from 'react';
import { ingresosApi } from '../api/ingresos';
import { cajasApi } from '../api/cajas';
import { catalogosApi } from '../api/catalogos';
import { clientesApi } from '../api/clientes';
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

export default function Ingresos() {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoIngresoId: '',
    clienteId: '',
    observacion: '',
    monedaId: '1',
    importe: '',
    cajaId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ingRes, cajasRes, tiposRes, clientesRes] = await Promise.all([
        ingresosApi.getAll({ page: 1, limit: 100 }),
        cajasApi.getAll(),
        catalogosApi.getTiposIngreso(),
        clientesApi.getAll(),
      ]);
      const ingData = ingRes.data as any;
      setIngresos(ingData.data?.data || ingData.data || []);
      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
      setTiposIngreso(tiposRes.data || []);
      setClientes(clientesRes.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await ingresosApi.create({
        fecha: form.fecha,
        tipoIngresoId: parseInt(form.tipoIngresoId),
        clienteId: form.clienteId ? parseInt(form.clienteId) : undefined,
        observacion: form.observacion,
        monedaId: parseInt(form.monedaId),
        importe: parseFloat(form.importe),
        cajaId: parseInt(form.cajaId),
      });
      toast.success('Ingreso registrado');
      setShowModal(false);
      setForm({ fecha: new Date().toISOString().split('T')[0], tipoIngresoId: '', clienteId: '', observacion: '', monedaId: '1', importe: '', cajaId: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al registrar ingreso');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (i: any) => formatDate(i.IngresoFecha || i.fecha) },
    { key: 'tipo', header: 'Tipo', render: (i: any) => i.tipoIngreso?.TipoIngresoNombre || i.tipoIngreso?.nombre || '-' },
    { key: 'observacion', header: 'Observacion', render: (i: any) => i.IngresoObservacion || i.observacion || '-' },
    { key: 'importe', header: 'Importe', render: (i: any) => {
      const imp = Number(i.IngresoImporte || i.importe);
      const monId = i.MonedaId || i.monedaId;
      return <span className="font-semibold text-emerald-600">{formatMoney(imp, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ingresos</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-1" /> Nuevo Ingreso
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={ingresos} />
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Ingreso">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <Select
            label="Tipo de Ingreso"
            value={form.tipoIngresoId}
            onChange={(e) => setForm({ ...form, tipoIngresoId: e.target.value })}
            options={tiposIngreso.map((t: any) => ({ value: t.id || t.TipoIngresoId, label: t.nombre || t.TipoIngresoNombre }))}
            placeholder="Seleccionar tipo"
          />
          <Select
            label="Cliente (opcional)"
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))}
            placeholder="Seleccionar cliente"
          />
          <Select
            label="Caja"
            value={form.cajaId}
            onChange={(e) => setForm({ ...form, cajaId: e.target.value })}
            options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))}
            placeholder="Seleccionar caja"
          />
          <Select
            label="Moneda"
            value={form.monedaId}
            onChange={(e) => setForm({ ...form, monedaId: e.target.value })}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]}
          />
          <Input label="Importe" type="number" step="0.01" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} placeholder="0.00" />
          <Input label="Observacion" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} placeholder="Observacion (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="success" loading={saving} onClick={handleCreate}>Registrar Ingreso</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
