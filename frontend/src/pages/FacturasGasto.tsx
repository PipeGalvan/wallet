import { useEffect, useState } from 'react';
import { facturasGastoApi } from '../api/facturas-gasto';
import { cajasApi } from '../api/cajas';
import { catalogosApi } from '../api/catalogos';
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

export default function FacturasGasto() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPagar, setShowPagar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [cajas, setCajas] = useState<any[]>([]);
  const [tiposEgreso, setTiposEgreso] = useState<any[]>([]);

  const [createForm, setCreateForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoEgresoId: '',
    importe: '',
    monedaId: '1',
    observacion: '',
    fechaVencimiento: '',
  });

  const [pagarForm, setPagarForm] = useState({
    importe: '',
    cajaId: '',
    monedaId: '1',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [factRes, cajasRes, tiposRes] = await Promise.all([
        facturasGastoApi.getAll({ page: 1, limit: 100 }),
        cajasApi.getAll(),
        catalogosApi.getTiposEgreso(),
      ]);
      const factData = factRes.data as any;
      setFacturas(factData.data?.data || factData.data || []);
      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
      setTiposEgreso(tiposRes.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await facturasGastoApi.create({
        fecha: createForm.fecha,
        tipoEgresoId: parseInt(createForm.tipoEgresoId),
        importe: parseFloat(createForm.importe),
        monedaId: parseInt(createForm.monedaId),
        observacion: createForm.observacion,
        fechaVencimiento: createForm.fechaVencimiento || undefined,
      });
      toast.success('Factura de gasto creada');
      setShowCreate(false);
      resetCreateForm();
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al crear factura');
    } finally { setSaving(false); }
  };

  const handlePagar = async () => {
    if (!selectedFactura) return;
    setSaving(true);
    try {
      await facturasGastoApi.pagar(selectedFactura.FacturaGastoId || selectedFactura.id, {
        importe: parseFloat(pagarForm.importe),
        cajaId: parseInt(pagarForm.cajaId),
        monedaId: parseInt(pagarForm.monedaId),
      });
      toast.success('Pago registrado');
      setShowPagar(false);
      setPagarForm({ importe: '', cajaId: '', monedaId: '1' });
      setSelectedFactura(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al pagar factura');
    } finally { setSaving(false); }
  };

  const openPagar = (factura: any) => {
    setSelectedFactura(factura);
    const saldo = Number(factura.FacturaGastoSaldo || factura.saldo || 0);
    setPagarForm({ importe: saldo.toString(), cajaId: '', monedaId: String(factura.MonedaId || factura.monedaId || 1) });
    setShowPagar(true);
  };

  const resetCreateForm = () => {
    setCreateForm({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', importe: '', monedaId: '1', observacion: '', fechaVencimiento: '' });
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (f: any) => formatDate(f.FacturaGastoFecha || f.fecha) },
    { key: 'tipo', header: 'Tipo Egreso', render: (f: any) => f.tipoEgreso?.TipoEgresoNombre || f.tipoEgreso?.nombre || '-' },
    { key: 'importe', header: 'Importe', render: (f: any) => {
      const imp = Number(f.FacturaGastoImporte || f.importe);
      const monId = f.MonedaId || f.monedaId;
      return <span className="font-semibold">{formatMoney(imp, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
    { key: 'saldo', header: 'Saldo', render: (f: any) => {
      const saldo = Number(f.FacturaGastoSaldo || f.saldo || 0);
      const monId = f.MonedaId || f.monedaId;
      return <span className={`font-semibold ${saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatMoney(saldo, MONEDA_SYMBOLS[monId] || '$')}</span>;
    }},
    { key: 'vencimiento', header: 'Vencimiento', render: (f: any) => {
      const venc = f.FacturaGastoFechaVencimiento || f.fechaVencimiento;
      return venc ? formatDate(venc) : '-';
    }},
    { key: 'estado', header: 'Estado', render: (f: any) => {
      const saldo = Number(f.FacturaGastoSaldo || f.saldo || 0);
      const importe = Number(f.FacturaGastoImporte || f.importe || 0);
      if (saldo <= 0) return <Badge variant="success">Pagada</Badge>;
      if (saldo < importe) return <Badge variant="warning">Parcial</Badge>;
      return <Badge variant="danger">Pendiente</Badge>;
    }},
    { key: 'acciones', header: '', render: (f: any) => {
      const saldo = Number(f.FacturaGastoSaldo || f.saldo || 0);
      if (saldo <= 0) return null;
      return (
        <Button variant="success" size="sm" onClick={() => openPagar(f)}>
          <DollarSign size={14} className="mr-1" /> Pagar
        </Button>
      );
    }},
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Facturas a Pagar</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Nueva Factura
        </Button>
      </div>

      <Card><Table columns={columns} data={facturas} /></Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Factura de Gasto">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={createForm.fecha} onChange={(e) => setCreateForm({ ...createForm, fecha: e.target.value })} />
          <Select label="Tipo de Egreso" value={createForm.tipoEgresoId} onChange={(e) => setCreateForm({ ...createForm, tipoEgresoId: e.target.value })}
            options={tiposEgreso.map((t: any) => ({ value: t.id || t.TipoEgresoId, label: t.nombre || t.TipoEgresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Moneda" value={createForm.monedaId} onChange={(e) => setCreateForm({ ...createForm, monedaId: e.target.value })}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]} />
          <Input label="Importe" type="number" step="0.01" value={createForm.importe} onChange={(e) => setCreateForm({ ...createForm, importe: e.target.value })} placeholder="0.00" />
          <Input label="Fecha Vencimiento" type="date" value={createForm.fechaVencimiento} onChange={(e) => setCreateForm({ ...createForm, fechaVencimiento: e.target.value })} />
          <Input label="Observacion" value={createForm.observacion} onChange={(e) => setCreateForm({ ...createForm, observacion: e.target.value })} placeholder="Observacion (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleCreate}>Crear Factura</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showPagar} onClose={() => { setShowPagar(false); setSelectedFactura(null); }} title="Pagar Factura">
        {selectedFactura && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Saldo pendiente: <span className="font-semibold">{formatMoney(Number(selectedFactura.FacturaGastoSaldo || selectedFactura.saldo), MONEDA_SYMBOLS[selectedFactura.MonedaId || selectedFactura.monedaId] || '$')}</span></p>
            </div>
            <Input label="Monto a pagar" type="number" step="0.01" value={pagarForm.importe} onChange={(e) => setPagarForm({ ...pagarForm, importe: e.target.value })} />
            <Select label="Caja" value={pagarForm.cajaId} onChange={(e) => setPagarForm({ ...pagarForm, cajaId: e.target.value })}
              options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja" />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setShowPagar(false); setSelectedFactura(null); }}>Cancelar</Button>
              <Button variant="danger" loading={saving} onClick={handlePagar}>Registrar Pago</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
