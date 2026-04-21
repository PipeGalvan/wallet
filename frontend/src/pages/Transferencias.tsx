import { useEffect, useState } from 'react';
import { transferenciasApi } from '../api/transferencias';
import { cajasApi } from '../api/cajas';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Plus, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Transferencias() {
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    cajaOrigenId: '',
    cajaDestinoId: '',
    monedaId: '1',
    importe: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        transferenciasApi.getAll({ page: 1, limit: 100 }),
        cajasApi.getAll({ activo: 'true' }),
      ]);
      const tData = tRes.data as any;
      setTransferencias(tData.data?.data || tData.data || []);
      setCajas(((cRes.data as any).data || cRes.data) || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (form.cajaOrigenId === form.cajaDestinoId) {
      toast.error('La caja origen y destino deben ser diferentes');
      return;
    }
    setSaving(true);
    try {
      await transferenciasApi.create({
        fecha: form.fecha,
        cajaOrigenId: parseInt(form.cajaOrigenId),
        cajaDestinoId: parseInt(form.cajaDestinoId),
        monedaId: parseInt(form.monedaId),
        importe: parseFloat(form.importe),
      });
      toast.success('Transferencia registrada');
      setShowModal(false);
      setForm({ fecha: new Date().toISOString().split('T')[0], cajaOrigenId: '', cajaDestinoId: '', monedaId: '1', importe: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al registrar transferencia');
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (t: any) => formatDate(t.TransferenciaFecha || t.fecha) },
    { key: 'origen', header: 'Origen', render: (t: any) => t.origenCaja?.CajaNombre || t.cajaOrigen?.nombre || '-' },
    { key: 'destino', header: 'Destino', render: (t: any) => t.destinoCaja?.CajaNombre || t.cajaDestino?.nombre || '-' },
    { key: 'importe', header: 'Importe', render: (t: any) => {
      const imp = Number(t.TransferenciaImporte || t.importe);
      const monId = t.MonedaId || t.monedaId;
      return <span className="font-semibold text-blue-600">{formatMoney(imp, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Transferencias</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-1" /> Nueva Transferencia
        </Button>
      </div>

      <Card><Table columns={columns} data={transferencias} /></Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Transferencia">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <Select label="Caja Origen" value={form.cajaOrigenId} onChange={(e) => setForm({ ...form, cajaOrigenId: e.target.value })}
            options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja origen" />
          <Select label="Caja Destino" value={form.cajaDestinoId} onChange={(e) => setForm({ ...form, cajaDestinoId: e.target.value })}
            options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja destino" />
          <Select label="Moneda" value={form.monedaId} onChange={(e) => setForm({ ...form, monedaId: e.target.value })}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]} />
          <Input label="Importe" type="number" step="0.01" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} placeholder="0.00" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="success" loading={saving} onClick={handleCreate}>
              <ArrowRightLeft size={16} className="mr-1" /> Transferir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
