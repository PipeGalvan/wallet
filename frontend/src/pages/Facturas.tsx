import { useEffect, useState } from 'react';
import { facturasApi } from '../api/facturas';
import { cajasApi } from '../api/cajas';
import { clientesApi } from '../api/clientes';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Plus, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Facturas() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCobrar, setShowCobrar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);

  const [createForm, setCreateForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    clienteId: '',
    importe: '',
    monedaId: '1',
    observacion: '',
  });

  const [cobrarForm, setCobrarForm] = useState({
    importe: '',
    cajaId: '',
    monedaId: '1',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [factRes, clientesRes, cajasRes] = await Promise.all([
        facturasApi.getAll({ page: 1, limit: 100 }),
        clientesApi.getAll(),
        cajasApi.getAll(),
      ]);
      const factData = factRes.data as any;
      setFacturas(factData.data?.data || factData.data || []);
      setClientes(clientesRes.data || []);
      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await facturasApi.create({
        fecha: createForm.fecha,
        clienteId: parseInt(createForm.clienteId),
        importe: parseFloat(createForm.importe),
        monedaId: parseInt(createForm.monedaId),
        observacion: createForm.observacion,
      });
      toast.success('Factura creada');
      setShowCreate(false);
      resetCreateForm();
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al crear factura');
    } finally { setSaving(false); }
  };

  const handleCobrar = async () => {
    if (!selectedFactura) return;
    setSaving(true);
    try {
      await facturasApi.cobrar(selectedFactura.FacturaId || selectedFactura.id, {
        importe: parseFloat(cobrarForm.importe),
        cajaId: parseInt(cobrarForm.cajaId),
        monedaId: parseInt(cobrarForm.monedaId),
      });
      toast.success('Cobro registrado');
      setShowCobrar(false);
      setCobrarForm({ importe: '', cajaId: '', monedaId: '1' });
      setSelectedFactura(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al cobrar factura');
    } finally { setSaving(false); }
  };

  const openCobrar = (factura: any) => {
    setSelectedFactura(factura);
    const saldo = Number(factura.FacturaSaldo || factura.saldo || 0);
    setCobrarForm({ importe: saldo.toString(), cajaId: '', monedaId: String(factura.MonedaId || factura.monedaId || 1) });
    setShowCobrar(true);
  };

  const resetCreateForm = () => {
    setCreateForm({ fecha: new Date().toISOString().split('T')[0], clienteId: '', importe: '', monedaId: '1', observacion: '' });
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (f: any) => formatDate(f.FacturaFecha || f.fecha) },
    { key: 'cliente', header: 'Cliente', render: (f: any) => f.cliente?.ClienteNombre || f.cliente?.nombre || '-' },
    { key: 'importe', header: 'Importe', render: (f: any) => {
      const imp = Number(f.FacturaImporte || f.importe);
      const monId = f.MonedaId || f.monedaId;
      return <span className="font-semibold">{formatMoney(imp, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
    { key: 'saldo', header: 'Saldo', render: (f: any) => {
      const saldo = Number(f.FacturaSaldo || f.saldo || 0);
      const monId = f.MonedaId || f.monedaId;
      return <span className={`font-semibold ${saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatMoney(saldo, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
    { key: 'estado', header: 'Estado', render: (f: any) => {
      const saldo = Number(f.FacturaSaldo || f.saldo || 0);
      const importe = Number(f.FacturaImporte || f.importe || 0);
      if (saldo <= 0) return <Badge variant="success">Cobrada</Badge>;
      if (saldo < importe) return <Badge variant="warning">Parcial</Badge>;
      return <Badge variant="danger">Pendiente</Badge>;
    }},
    { key: 'acciones', header: '', render: (f: any) => {
      const saldo = Number(f.FacturaSaldo || f.saldo || 0);
      if (saldo <= 0) return null;
      return (
        <Button variant="success" size="sm" onClick={() => openCobrar(f)}>
          <DollarSign size={14} className="mr-1" /> Cobrar
        </Button>
      );
    }},
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Facturas a Cobrar</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Nueva Factura
        </Button>
      </div>

      <Card><Table columns={columns} data={facturas} /></Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Factura">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={createForm.fecha} onChange={(e) => setCreateForm({ ...createForm, fecha: e.target.value })} />
          <Select label="Cliente" value={createForm.clienteId} onChange={(e) => setCreateForm({ ...createForm, clienteId: e.target.value })}
            options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))} placeholder="Seleccionar cliente" />
          <Select label="Moneda" value={createForm.monedaId} onChange={(e) => setCreateForm({ ...createForm, monedaId: e.target.value })}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]} />
          <Input label="Importe" type="number" step="0.01" value={createForm.importe} onChange={(e) => setCreateForm({ ...createForm, importe: e.target.value })} placeholder="0.00" />
          <Input label="Observacion" value={createForm.observacion} onChange={(e) => setCreateForm({ ...createForm, observacion: e.target.value })} placeholder="Observacion (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleCreate}>Crear Factura</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCobrar} onClose={() => { setShowCobrar(false); setSelectedFactura(null); }} title="Cobrar Factura">
        {selectedFactura && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Saldo pendiente: <span className="font-semibold">{formatMoney(Number(selectedFactura.FacturaSaldo || selectedFactura.saldo), MONEDA_SYMBOLS[selectedFactura.MonedaId || selectedFactura.monedaId] || '$')}</span></p>
            </div>
            <Input label="Monto a cobrar" type="number" step="0.01" value={cobrarForm.importe} onChange={(e) => setCobrarForm({ ...cobrarForm, importe: e.target.value })} />
            <Select label="Caja" value={cobrarForm.cajaId} onChange={(e) => setCobrarForm({ ...cobrarForm, cajaId: e.target.value })}
              options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja" />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setShowCobrar(false); setSelectedFactura(null); }}>Cancelar</Button>
              <Button variant="success" loading={saving} onClick={handleCobrar}>Registrar Cobro</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
