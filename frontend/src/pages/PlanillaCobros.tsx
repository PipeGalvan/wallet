import { useEffect, useState } from 'react';
import { planillasCobroApi } from '../api/planillas';
import { cajasApi } from '../api/cajas';
import { catalogosApi } from '../api/catalogos';
import { clientesApi } from '../api/clientes';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { formatMoney } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Plus, Eye, DollarSign, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlanillaCobros() {
  const [planillas, setPlanillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCobrar, setShowCobrar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlanilla, setSelectedPlanilla] = useState<any>(null);
  const [selectedDetalle, setSelectedDetalle] = useState<any>(null);
  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);

  const [createForm, setCreateForm] = useState({ mes: String(new Date().getMonth() + 1), anio: String(new Date().getFullYear()) });
  const [itemForm, setItemForm] = useState({ tipoIngresoId: '', clienteId: '', importe: '', monedaId: '1' });
  const [cobrarForm, setCobrarForm] = useState({ cajaId: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pRes, tiRes, clRes, cRes] = await Promise.all([
        planillasCobroApi.getAll(),
        catalogosApi.getTiposIngreso(),
        clientesApi.getAll(),
        cajasApi.getAll(),
      ]);
      setPlanillas((pRes.data as any)?.data || pRes.data || []);
      setTiposIngreso(tiRes.data || []);
      setClientes(clRes.data || []);
      setCajas(((cRes.data as any).data || cRes.data) || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await planillasCobroApi.create({ mes: parseInt(createForm.mes), anio: parseInt(createForm.anio) });
      toast.success('Planilla creada');
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al crear planilla');
    } finally { setSaving(false); }
  };

  const handleAddItem = async () => {
    if (!selectedPlanilla) return;
    setSaving(true);
    try {
      await planillasCobroApi.addItem(selectedPlanilla.PlanillaCobrosId || selectedPlanilla.id, {
        tipoIngresoId: parseInt(itemForm.tipoIngresoId),
        clienteId: itemForm.clienteId ? parseInt(itemForm.clienteId) : undefined,
        importe: parseFloat(itemForm.importe),
        monedaId: parseInt(itemForm.monedaId),
      });
      toast.success('Item agregado');
      setShowAddItem(false);
      setItemForm({ tipoIngresoId: '', clienteId: '', importe: '', monedaId: '1' });
      loadPlanillaDetail(selectedPlanilla.PlanillaCobrosId || selectedPlanilla.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al agregar item');
    } finally { setSaving(false); }
  };

  const handleCobrar = async () => {
    if (!selectedPlanilla || !selectedDetalle) return;
    setSaving(true);
    try {
      await planillasCobroApi.cobrarItem(
        selectedPlanilla.PlanillaCobrosId || selectedPlanilla.id,
        selectedDetalle.PlanillaCobrosDetalleId || selectedDetalle.id,
        { cajaId: parseInt(cobrarForm.cajaId) },
      );
      toast.success('Cobro registrado');
      setShowCobrar(false);
      setCobrarForm({ cajaId: '' });
      setSelectedDetalle(null);
      loadPlanillaDetail(selectedPlanilla.PlanillaCobrosId || selectedPlanilla.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al cobrar');
    } finally { setSaving(false); }
  };

  const loadPlanillaDetail = async (id: number) => {
    try {
      const res = await planillasCobroApi.getById(id);
      const detail = (res.data as any)?.data || res.data;
      setSelectedPlanilla(detail);
    } catch {}
  };

  const openDetail = async (planilla: any) => {
    await loadPlanillaDetail(planilla.PlanillaCobrosId || planilla.id);
  };

  const openCobrar = (detalle: any) => {
    setSelectedDetalle(detalle);
    setCobrarForm({ cajaId: '' });
    setShowCobrar(true);
  };

  const MES_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) return <Spinner />;

  if (selectedPlanilla) {
    const detalles: any[] = selectedPlanilla.detalles || selectedPlanilla.planillacobrosdetalles || [];
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedPlanilla(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ArrowLeft size={20} /></button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Planilla {MES_NAMES[selectedPlanilla.PlanillaCobrosMes || selectedPlanilla.mes] || ''} {selectedPlanilla.PlanillaCobrosAnio || selectedPlanilla.anio}
          </h1>
          <Button size="sm" onClick={() => setShowAddItem(true)}>
            <Plus size={14} className="mr-1" /> Agregar Item
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Tipo Ingreso</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Cliente</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Importe</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d: any, idx: number) => {
                  const cobrado = d.PlanillaCobrosDetallePagado || d.pagado;
                  return (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4">{d.tipoIngreso?.TipoIngresoNombre || d.tipoIngreso?.nombre || '-'}</td>
                      <td className="py-3 px-4">{d.cliente?.ClienteNombre || d.cliente?.nombre || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatMoney(Number(d.PlanillaCobrosDetalleImporte || d.importe), MONEDA_SYMBOLS[d.MonedaId || d.monedaId] || '$')}</td>
                      <td className="py-3 px-4">{cobrado ? <Badge variant="success">Cobrado</Badge> : <Badge variant="danger">Pendiente</Badge>}</td>
                      <td className="py-3 px-4 text-right">
                        {!cobrado && (
                          <Button variant="success" size="sm" onClick={() => openCobrar(d)}>
                            <DollarSign size={14} className="mr-1" /> Cobrar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {detalles.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">Sin items. Agregue uno.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title="Agregar Item">
          <div className="space-y-4">
            <Select label="Tipo de Ingreso" value={itemForm.tipoIngresoId} onChange={(e) => setItemForm({ ...itemForm, tipoIngresoId: e.target.value })}
              options={tiposIngreso.map((t: any) => ({ value: t.id || t.TipoIngresoId, label: t.nombre || t.TipoIngresoNombre }))} placeholder="Seleccionar tipo" />
            <Select label="Cliente (opcional)" value={itemForm.clienteId} onChange={(e) => setItemForm({ ...itemForm, clienteId: e.target.value })}
              options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))} placeholder="Seleccionar cliente" />
            <Select label="Moneda" value={itemForm.monedaId} onChange={(e) => setItemForm({ ...itemForm, monedaId: e.target.value })}
              options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]} />
            <Input label="Importe" type="number" step="0.01" value={itemForm.importe} onChange={(e) => setItemForm({ ...itemForm, importe: e.target.value })} placeholder="0.00" />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowAddItem(false)}>Cancelar</Button>
              <Button loading={saving} onClick={handleAddItem}>Agregar</Button>
            </div>
          </div>
        </Modal>

        <Modal open={showCobrar} onClose={() => { setShowCobrar(false); setSelectedDetalle(null); }} title="Cobrar Item">
          <div className="space-y-4">
            {selectedDetalle && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">Importe: <span className="font-semibold">{formatMoney(Number(selectedDetalle.PlanillaCobrosDetalleImporte || selectedDetalle.importe), MONEDA_SYMBOLS[selectedDetalle.MonedaId || selectedDetalle.monedaId] || '$')}</span></p>
              </div>
            )}
            <Select label="Caja" value={cobrarForm.cajaId} onChange={(e) => setCobrarForm({ ...cobrarForm, cajaId: e.target.value })}
              options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja" />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setShowCobrar(false); setSelectedDetalle(null); }}>Cancelar</Button>
              <Button variant="success" loading={saving} onClick={handleCobrar}>Registrar Cobro</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Planilla de Cobros</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Nueva Planilla
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Periodo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Accion</th>
              </tr>
            </thead>
            <tbody>
              {planillas.map((p: any) => {
                const id = p.PlanillaCobrosId || p.id;
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">{MES_NAMES[p.PlanillaCobrosMes || p.mes] || '-'} {p.PlanillaCobrosAnio || p.anio}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(p)}>
                        <Eye size={14} className="mr-1" /> Ver
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {planillas.length === 0 && (
                <tr><td colSpan={2} className="py-8 text-center text-gray-400 dark:text-gray-500">No hay planillas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Planilla">
        <div className="space-y-4">
          <Select label="Mes" value={createForm.mes} onChange={(e) => setCreateForm({ ...createForm, mes: e.target.value })}
            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: MES_NAMES[i + 1] }))} />
          <Input label="Anio" type="number" value={createForm.anio} onChange={(e) => setCreateForm({ ...createForm, anio: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleCreate}>Crear</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
