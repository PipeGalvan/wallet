import { useEffect, useState } from 'react';
import { movimientosRecurrentesApi } from '../api/movimientos-recurrentes';
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
import MoneyInput from '../components/shared/MoneyInput';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import {
  Plus,
  CheckCircle,
  Pause,
  Play,
  Trash2,
  Edit3,
  CheckCheck,
  Clock,
  Repeat,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  MovimientoRecurrente,
  UpdateMovimientoRecurrente,
} from '../types/movimientoRecurrente';

type Tab = 'pendientes' | 'recurrentes';
type FilterTab = 'todos' | 'ingresos' | 'egresos' | 'pausados';

const emptyForm: CreateFormState = {
  tipo: 'INGRESO',
  tipoMovimientoId: '',
  clienteId: '',
  montoEstimado: 0,
  cajaId: '',
  monedaId: '1',
  observacion: '',
  diaDelMes: '1',
  fechaInicio: new Date().toISOString().split('T')[0],
  cantidadOcurrencias: '',
};

interface CreateFormState {
  tipo: 'INGRESO' | 'EGRESO';
  tipoMovimientoId: string;
  clienteId: string;
  montoEstimado: number;
  cajaId: string;
  monedaId: string;
  observacion: string;
  diaDelMes: string;
  fechaInicio: string;
  cantidadOcurrencias: string;
}

interface ConfirmFormState {
  importe: number;
  fecha: string;
  observacion: string;
}

interface BatchItem {
  template: MovimientoRecurrente;
  importe: number;
}

export default function MovimientosRecurrentes() {
  // Data state
  const [templates, setTemplates] = useState<MovimientoRecurrente[]>([]);
  const [pendientes, setPendientes] = useState<MovimientoRecurrente[]>([]);
  const [loading, setLoading] = useState(true);

  // UI tab state
  const [activeTab, setActiveTab] = useState<Tab>('pendientes');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Selected items
  const [selectedTemplate, setSelectedTemplate] = useState<MovimientoRecurrente | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MovimientoRecurrente | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Catalog data
  const [cajas, setCajas] = useState<any[]>([]);
  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [tiposEgreso, setTiposEgreso] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Forms
  const [createForm, setCreateForm] = useState<CreateFormState>({ ...emptyForm });
  const [confirmForm, setConfirmForm] = useState<ConfirmFormState>({
    importe: 0,
    fecha: new Date().toISOString().split('T')[0],
    observacion: '',
  });
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tmplRes, pendRes, cajasRes, tiposIngRes, tiposEgrRes, clientesRes] =
        await Promise.all([
          movimientosRecurrentesApi.getAll({ page: 1, limit: 100 }),
          movimientosRecurrentesApi.getPendientes(),
          cajasApi.getAll(),
          catalogosApi.getTiposIngreso(),
          catalogosApi.getTiposEgreso(),
          clientesApi.getAll(),
        ]);

      const tmplData = tmplRes.data as any;
      setTemplates(tmplData.data?.data || tmplData.data || []);

      const pendData = pendRes.data as any;
      setPendientes(Array.isArray(pendData) ? pendData : pendData?.data || []);

      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
      setTiposIngreso(tiposIngRes.data || []);
      setTiposEgreso(tiposEgrRes.data || []);
      setClientes(clientesRes.data || []);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  // ──── Helpers ────

  const getConceptName = (t: MovimientoRecurrente): string => {
    const tipos = t.tipo === 'INGRESO' ? tiposIngreso : tiposEgreso;
    const found = tipos.find(
      (tp: any) =>
        (tp.id || tp.TipoIngresoId || tp.TipoEgresoId) === t.tipoMovimientoId,
    );
    if (found)
      return found.nombre || found.TipoIngresoNombre || found.TipoEgresoNombre;
    return t.observacion || 'Sin categoría';
  };

  const getCajaName = (t: MovimientoRecurrente): string => {
    if (t.caja) return t.caja.nombre;
    const found = cajas.find((c: any) => (c.id || c.CajaId) === t.cajaId);
    return found ? found.nombre || found.CajaNombre : '—';
  };

  const getMonedaSymbol = (t: MovimientoRecurrente): string => {
    return MONEDA_SYMBOLS[t.monedaId] || '$';
  };

  const getMonedaLabel = (t: MovimientoRecurrente): string => {
    if (t.moneda) return t.moneda.nombre;
    return t.monedaId === 2 ? 'USD' : 'ARS';
  };

  const getClienteName = (t: MovimientoRecurrente): string | null => {
    if (t.cliente?.nombre) return t.cliente.nombre;
    if (t.clienteId) {
      const found = clientes.find((c: any) => (c.id || c.ClienteId) === t.clienteId);
      return found ? found.nombre || found.ClienteNombre : null;
    }
    return null;
  };

  const currentTipos = createForm.tipo === 'INGRESO' ? tiposIngreso : tiposEgreso;

  // ──── Filtered templates ────

  const filteredTemplates = templates.filter((t) => {
    switch (filterTab) {
      case 'ingresos':
        return t.tipo === 'INGRESO' && t.activo;
      case 'egresos':
        return t.tipo === 'EGRESO' && t.activo;
      case 'pausados':
        return t.pausado;
      case 'todos':
      default:
        return true;
    }
  });

  // ──── Handlers: Create ────

  const handleCreate = async () => {
    if (!createForm.tipoMovimientoId || !createForm.cajaId) {
      toast.error('Completá los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      await movimientosRecurrentesApi.create({
        tipo: createForm.tipo,
        tipoMovimientoId: parseInt(createForm.tipoMovimientoId),
        clienteId: createForm.clienteId ? parseInt(createForm.clienteId) : undefined,
        montoEstimado: createForm.montoEstimado,
        cajaId: parseInt(createForm.cajaId),
        monedaId: parseInt(createForm.monedaId),
        observacion: createForm.observacion || undefined,
        frecuencia: 'mensual',
        diaDelMes: parseInt(createForm.diaDelMes),
        fechaInicio: createForm.fechaInicio,
        cantidadOcurrencias: createForm.cantidadOcurrencias
          ? parseInt(createForm.cantidadOcurrencias)
          : undefined,
      });
      toast.success('Movimiento recurrente creado');
      setShowCreateModal(false);
      setCreateForm({ ...emptyForm });
      setLoading(true);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  // ──── Handlers: Edit ────

  const openEdit = (t: MovimientoRecurrente) => {
    setEditingTemplate(t);
    setCreateForm({
      tipo: t.tipo as 'INGRESO' | 'EGRESO',
      tipoMovimientoId: String(t.tipoMovimientoId),
      clienteId: t.clienteId ? String(t.clienteId) : '',
      montoEstimado: Number(t.montoEstimado),
      cajaId: String(t.cajaId),
      monedaId: String(t.monedaId),
      observacion: t.observacion || '',
      diaDelMes: String(t.diaDelMes),
      fechaInicio: t.fechaInicio
        ? (typeof t.fechaInicio === 'string'
            ? t.fechaInicio.split('T')[0]
            : new Date(t.fechaInicio).toISOString().split('T')[0])
        : '',
      cantidadOcurrencias: t.ocurrenciasTotales ? String(t.ocurrenciasTotales) : '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const dto: UpdateMovimientoRecurrente = {};
      if (createForm.tipoMovimientoId) dto.tipoMovimientoId = parseInt(createForm.tipoMovimientoId);
      if (createForm.clienteId) dto.clienteId = parseInt(createForm.clienteId);
      dto.montoEstimado = createForm.montoEstimado;
      dto.cajaId = parseInt(createForm.cajaId);
      dto.monedaId = parseInt(createForm.monedaId);
      dto.observacion = createForm.observacion || undefined;
      dto.diaDelMes = parseInt(createForm.diaDelMes);
      dto.fechaInicio = createForm.fechaInicio;
      dto.cantidadOcurrencias = createForm.cantidadOcurrencias
        ? parseInt(createForm.cantidadOcurrencias)
        : undefined;

      await movimientosRecurrentesApi.update(editingTemplate.id, dto);
      toast.success('Movimiento recurrente actualizado');
      setShowEditModal(false);
      setEditingTemplate(null);
      setCreateForm({ ...emptyForm });
      setLoading(true);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  // ──── Handlers: Delete ────

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await movimientosRecurrentesApi.delete(selectedTemplate.id);
      toast.success('Movimiento recurrente eliminado');
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
      setLoading(true);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  // ──── Handlers: Pause/Resume ────

  const handleTogglePause = async (t: MovimientoRecurrente) => {
    try {
      if (t.pausado) {
        await movimientosRecurrentesApi.reanudar(t.id);
        toast.success('Movimiento recurrente reanudado');
      } else {
        await movimientosRecurrentesApi.pausar(t.id);
        toast.success('Movimiento recurrente pausado');
      }
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // ──── Handlers: Single Confirm ────

  const openConfirm = (t: MovimientoRecurrente) => {
    setSelectedTemplate(t);
    setConfirmForm({
      importe: Number(t.montoEstimado),
      fecha: t.fechaProxima
        ? (typeof t.fechaProxima === 'string'
            ? t.fechaProxima.split('T')[0]
            : new Date(t.fechaProxima).toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0],
      observacion: '',
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await movimientosRecurrentesApi.confirmar(selectedTemplate.id, {
        importe: confirmForm.importe,
        observacion: confirmForm.observacion || undefined,
        fecha: confirmForm.fecha,
      });
      toast.success(
        `${selectedTemplate.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} confirmado`,
      );
      setShowConfirmModal(false);
      setSelectedTemplate(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar');
    } finally {
      setSaving(false);
    }
  };

  // ──── Handlers: Batch Confirm ────

  const openBatchConfirm = () => {
    const items: BatchItem[] = pendientes.map((t) => ({
      template: t,
      importe: Number(t.montoEstimado),
    }));
    setBatchItems(items);
    setShowBatchModal(true);
  };

  const handleBatchConfirm = async () => {
    setSaving(true);
    try {
      const results = await movimientosRecurrentesApi.confirmarLote({
        items: batchItems.map((bi) => ({
          id: bi.template.id,
          importe: bi.importe,
        })),
      });
      const resData = results.data as any;
      const successes = Array.isArray(resData)
        ? resData.filter((r: any) => r.success).length
        : 0;
      const errors = Array.isArray(resData)
        ? resData.filter((r: any) => !r.success).length
        : 0;

      if (errors === 0) {
        toast.success(`${successes} movimiento${successes !== 1 ? 's' : ''} confirmado${successes !== 1 ? 's' : ''}`);
      } else {
        toast(`${successes} confirmados, ${errors} con error`, { icon: '⚠️' });
      }
      setShowBatchModal(false);
      setBatchItems([]);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en confirmación por lote');
    } finally {
      setSaving(false);
    }
  };

  const updateBatchItemImporte = (index: number, importe: number) => {
    setBatchItems((prev) =>
      prev.map((bi, i) => (i === index ? { ...bi, importe } : bi)),
    );
  };

  // ──── Form JSX (shared between Create and Edit) ────

  const renderForm = (form: CreateFormState, setForm: React.Dispatch<React.SetStateAction<CreateFormState>>) => (
    <div className="space-y-4">
      {/* Tipo selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Tipo</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
              form.tipo === 'INGRESO'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700'
                : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
            }`}
            onClick={() =>
              setForm({ ...form, tipo: 'INGRESO', tipoMovimientoId: '', clienteId: '' })
            }
          >
            Ingreso
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
              form.tipo === 'EGRESO'
                ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'
                : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
            }`}
            onClick={() =>
              setForm({ ...form, tipo: 'EGRESO', tipoMovimientoId: '', clienteId: '' })
            }
          >
            Egreso
          </button>
        </div>
      </div>

      {/* Categoría */}
      <Select
        label={form.tipo === 'INGRESO' ? 'Tipo de Ingreso' : 'Tipo de Egreso'}
        value={form.tipoMovimientoId}
        onChange={(e) => setForm({ ...form, tipoMovimientoId: e.target.value })}
        options={currentTipos.map((t: any) => ({
          value: t.id || t.TipoIngresoId || t.TipoEgresoId,
          label: t.nombre || t.TipoIngresoNombre || t.TipoEgresoNombre,
        }))}
        placeholder="Seleccionar categoría"
      />

      {/* Cliente (only for INGRESO) */}
      {form.tipo === 'INGRESO' && (
        <Select
          label="Cliente (opcional)"
          value={form.clienteId}
          onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
          options={clientes.map((c: any) => ({
            value: c.id || c.ClienteId,
            label: c.nombre || c.ClienteNombre,
          }))}
          placeholder="Seleccionar cliente"
        />
      )}

      {/* Monto */}
      <MoneyInput
        label="Monto Estimado"
        value={form.montoEstimado}
        onChange={(val) => setForm({ ...form, montoEstimado: val })}
      />

      {/* Caja */}
      <Select
        label="Caja"
        value={form.cajaId}
        onChange={(e) => setForm({ ...form, cajaId: e.target.value })}
        options={cajas
          .filter((c: any) => c.activo !== false && c.CajaActivo !== false)
          .map((c: any) => ({
            value: c.id || c.CajaId,
            label: c.nombre || c.CajaNombre,
          }))}
        placeholder="Seleccionar caja"
      />

      {/* Moneda */}
      <Select
        label="Moneda"
        value={form.monedaId}
        onChange={(e) => setForm({ ...form, monedaId: e.target.value })}
        options={[
          { value: 1, label: '$ (ARS)' },
          { value: 2, label: 'USD' },
        ]}
      />

      {/* Observación */}
      <Input
        label="Observación"
        value={form.observacion}
        onChange={(e) => setForm({ ...form, observacion: e.target.value })}
        placeholder="Observación (opcional)"
      />

      {/* Frecuencia (fixed) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
          Frecuencia
        </label>
        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          Mensual
        </div>
      </div>

      {/* Día del mes */}
      <div>
        <Input
          label="Día del mes"
          type="number"
          min="1"
          max="31"
          value={form.diaDelMes}
          onChange={(e) => setForm({ ...form, diaDelMes: e.target.value })}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ej: 1 para el primer día de cada mes</p>
      </div>

      {/* Fecha inicio */}
      <Input
        label="Fecha de inicio"
        type="date"
        value={form.fechaInicio}
        onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
      />

      {/* Cantidad ocurrencias */}
      <Input
        label="Cantidad de ocurrencias (opcional)"
        type="number"
        min="1"
        value={form.cantidadOcurrencias}
        onChange={(e) => setForm({ ...form, cantidadOcurrencias: e.target.value })}
        placeholder="Dejar vacío para indefinido"
      />
    </div>
  );

  // ──── Render: Loading ────

  if (loading) return <Spinner />;

  // ──── Render: Main ────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Movimientos Recurrentes
        </h1>
        <Button onClick={() => { setCreateForm({ ...emptyForm }); setShowCreateModal(true); }}>
          <Plus size={16} className="mr-1" /> Nuevo Recurrente
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pendientes'
              ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('pendientes')}
        >
          <Clock size={14} className="inline mr-1.5 -mt-0.5" />
          Pendientes
          {pendientes.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recurrentes'
              ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('recurrentes')}
        >
          <Repeat size={14} className="inline mr-1.5 -mt-0.5" />
          Mis Recurrentes
        </button>
      </div>

      {/* ──── Pendientes Section ──── */}
      {activeTab === 'pendientes' && (
        <div>
          {pendientes.length > 0 && (
            <div className="mb-4">
              <Button variant="success" onClick={openBatchConfirm}>
                <CheckCheck size={16} className="mr-1" /> Confirmar todos ({pendientes.length})
              </Button>
            </div>
          )}

          {pendientes.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-lg">No tenés movimientos recurrentes pendientes 🎉</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendientes.map((t) => (
                <Card key={t.id}>
                  <div className="space-y-3">
                    {/* Header: tipo badge + date */}
                    <div className="flex items-center justify-between">
                      <Badge variant={t.tipo === 'INGRESO' ? 'success' : 'danger'}>
                        {t.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} className="inline mr-1 -mt-0.5" />
                        {formatDate(t.fechaProxima || '')}
                      </span>
                    </div>

                    {/* Concept */}
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {getConceptName(t)}
                    </p>

                    {/* Cliente (solo si tiene) */}
                    {getClienteName(t) && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Cliente: {getClienteName(t)}
                      </p>
                    )}

                    {/* Amount */}
                    <p className={`text-lg font-bold ${t.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatMoney(Number(t.montoEstimado), getMonedaSymbol(t))}
                    </p>

                    {/* Details */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>Caja: {getCajaName(t)}</p>
                      <p>Moneda: {getMonedaLabel(t)}</p>
                    </div>

                    {/* Confirm button */}
                    <Button
                      variant={t.tipo === 'INGRESO' ? 'success' : 'danger'}
                      size="sm"
                      className="w-full"
                      onClick={() => openConfirm(t)}
                    >
                      <CheckCircle size={14} className="mr-1" /> Confirmar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──── Mis Recurrentes Section ──── */}
      {activeTab === 'recurrentes' && (
        <div>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['todos', 'ingresos', 'egresos', 'pausados'] as FilterTab[]).map((ft) => (
              <button
                key={ft}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterTab === ft
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => setFilterTab(ft)}
              >
                {ft === 'todos' && 'Todos'}
                {ft === 'ingresos' && 'Ingresos'}
                {ft === 'egresos' && 'Egresos'}
                {ft === 'pausados' && 'Pausados'}
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-lg">No tenés movimientos recurrentes. Creá uno para empezar.</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((t) => (
                <Card key={t.id}>
                  <div className="space-y-3">
                    {/* Header row: tipo badge + status */}
                    <div className="flex items-center justify-between">
                      <Badge variant={t.tipo === 'INGRESO' ? 'success' : 'danger'}>
                        {t.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                      {!t.activo ? (
                        <Badge variant="default">Inactivo</Badge>
                      ) : t.pausado ? (
                        <Badge variant="warning">Pausado</Badge>
                      ) : (
                        <Badge variant="info">Activo</Badge>
                      )}
                    </div>

                    {/* Concept */}
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {getConceptName(t)}
                    </p>

                    {/* Cliente (solo si tiene) */}
                    {getClienteName(t) && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Cliente: {getClienteName(t)}
                      </p>
                    )}

                    {/* Amount + Moneda */}
                    <p className={`text-lg font-bold ${t.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatMoney(Number(t.montoEstimado), getMonedaSymbol(t))}
                    </p>

                    {/* Details */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>Caja: {getCajaName(t)}</p>
                      <p>Frecuencia: Mensual, día {t.diaDelMes}</p>
                      <p>
                        Ocurrencias:{' '}
                        {t.ocurrenciasTotales
                          ? `${t.ocurrenciasConfirmadas}/${t.ocurrenciasTotales}`
                          : `${t.ocurrenciasConfirmadas} confirmados`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {t.activo && !t.pausado && (
                        <Button
                          variant={t.tipo === 'INGRESO' ? 'success' : 'danger'}
                          size="sm"
                          onClick={() => openConfirm(t)}
                        >
                          <CheckCircle size={14} className="mr-1" /> Confirmar ahora
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Edit3 size={14} className="mr-1" /> Editar
                      </Button>
                      {t.activo && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTogglePause(t)}
                        >
                          {t.pausado ? (
                            <><Play size={14} className="mr-1" /> Reanudar</>
                          ) : (
                            <><Pause size={14} className="mr-1" /> Pausar</>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(t);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 size={14} className="mr-1 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──── Create Modal ──── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Movimiento Recurrente"
        maxWidth="max-w-lg"
      >
        {renderForm(createForm, setCreateForm)}
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleCreate}>
            Crear Recurrente
          </Button>
        </div>
      </Modal>

      {/* ──── Edit Modal ──── */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
        }}
        title="Editar Movimiento Recurrente"
        maxWidth="max-w-lg"
      >
        {renderForm(createForm, setCreateForm)}
        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setEditingTemplate(null);
            }}
          >
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleUpdate}>
            Guardar Cambios
          </Button>
        </div>
      </Modal>

      {/* ──── Confirm Single Modal ──── */}
      <Modal
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedTemplate(null);
        }}
        title="Confirmar Movimiento"
        maxWidth="max-w-md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {/* Template info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={selectedTemplate.tipo === 'INGRESO' ? 'success' : 'danger'}>
                  {selectedTemplate.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                </Badge>
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {getConceptName(selectedTemplate)}
              </p>
              {getClienteName(selectedTemplate) && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Cliente: {getClienteName(selectedTemplate)}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Caja: {getCajaName(selectedTemplate)} · {getMonedaLabel(selectedTemplate)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Estimado: {formatMoney(Number(selectedTemplate.montoEstimado), getMonedaSymbol(selectedTemplate))}
              </p>
            </div>

            {/* Editable fields */}
            <MoneyInput
              label="Importe real"
              value={confirmForm.importe}
              onChange={(val) => setConfirmForm({ ...confirmForm, importe: val })}
            />
            <Input
              label="Fecha"
              type="date"
              value={confirmForm.fecha}
              onChange={(e) => setConfirmForm({ ...confirmForm, fecha: e.target.value })}
            />
            <Input
              label="Observación"
              value={confirmForm.observacion}
              onChange={(e) => setConfirmForm({ ...confirmForm, observacion: e.target.value })}
              placeholder="Observación (opcional)"
            />

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant={selectedTemplate.tipo === 'INGRESO' ? 'success' : 'danger'}
                loading={saving}
                onClick={handleConfirm}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ──── Batch Confirm Modal ──── */}
      <Modal
        open={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchItems([]);
        }}
        title={`Confirmar ${batchItems.length} movimientos`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {batchItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay items para confirmar
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {batchItems.map((bi, idx) => (
                <div
                  key={bi.template.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={bi.template.tipo === 'INGRESO' ? 'success' : 'danger'}>
                        {bi.template.tipo === 'INGRESO' ? 'Ing' : 'Egr'}
                      </Badge>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                        {getConceptName(bi.template)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {getCajaName(bi.template)} · {formatDate(bi.template.fechaProxima || '')}
                      {getClienteName(bi.template) && ` · ${getClienteName(bi.template)}`}
                    </p>
                  </div>
                  <div className="w-36 flex-shrink-0">
                    <MoneyInput
                      value={bi.importe}
                      onChange={(val) => updateBatchItemImporte(idx, val)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBatchModal(false);
                setBatchItems([]);
              }}
            >
              Cancelar
            </Button>
            <Button variant="success" loading={saving} onClick={handleBatchConfirm}>
              <CheckCheck size={16} className="mr-1" /> Confirmar todos
            </Button>
          </div>
        </div>
      </Modal>

      {/* ──── Delete Confirm Dialog ──── */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedTemplate(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar movimiento recurrente"
        message={`¿Estás seguro de eliminar "${selectedTemplate ? getConceptName(selectedTemplate) : ''}"? Esta acción no se puede deshacer.`}
        loading={saving}
      />
    </div>
  );
}
