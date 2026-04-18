import { useEffect, useState, useCallback } from 'react';
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
import Pagination from '../components/ui/Pagination';
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Ingresos() {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ totalPages: 0, total: 0 });

  const [filters, setFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    monedaId: '',
    tipoIngresoId: '',
    search: '',
  });

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoIngresoId: '',
    clienteId: '',
    observacion: '',
    monedaId: '1',
    importe: '',
    cajaId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => setFormErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const loadData = useCallback(async () => {
    try {
      const params: any = { page, limit: pageSize };
      if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
      if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
      if (filters.monedaId) params.monedaId = filters.monedaId;
      if (filters.tipoIngresoId) params.tipoIngresoId = filters.tipoIngresoId;
      if (filters.search) params.search = filters.search;

      const [ingRes, cajasRes, tiposRes, clientesRes] = await Promise.all([
        ingresosApi.getAll(params),
        cajasApi.getAll(),
        catalogosApi.getTiposIngreso(),
        clientesApi.getAll(),
      ]);
      const ingData = (ingRes.data as any);
      const raw = ingData.data?.data || ingData.data || [];
      setIngresos(raw);
      const pag = ingData.data?.pagination || ingData.pagination;
      if (pag) setPagination({ totalPages: pag.totalPages, total: pag.total });
      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
      setTiposIngreso(((tiposRes.data as any).data || tiposRes.data) || []);
      setClientes(((clientesRes.data as any).data || clientesRes.data) || []);
    } catch {
      // handled by global interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ fechaDesde: '', fechaHasta: '', monedaId: '', tipoIngresoId: '', search: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!form.tipoIngresoId) errors.tipoIngresoId = 'Seleccioná un tipo de ingreso';
    if (!form.cajaId) errors.cajaId = 'Seleccioná una caja';
    if (!form.importe || parseFloat(form.importe) <= 0) errors.importe = 'Ingresá un importe válido';
    if (!form.fecha) errors.fecha = 'Seleccioná una fecha';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

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
      setFormErrors({});
      setForm({ fecha: new Date().toISOString().split('T')[0], tipoIngresoId: '', clienteId: '', observacion: '', monedaId: '1', importe: '', cajaId: '' });
      loadData();
    } catch {
      // server error handled by global interceptor
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

      {/* Filter Bar */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <Input label="Desde" type="date" value={filters.fechaDesde} onChange={(e) => handleFilterChange('fechaDesde', e.target.value)} />
          </div>
          <div className="w-36">
            <Input label="Hasta" type="date" value={filters.fechaHasta} onChange={(e) => handleFilterChange('fechaHasta', e.target.value)} />
          </div>
          <Select
            label="Moneda"
            value={filters.monedaId}
            onChange={(e) => handleFilterChange('monedaId', e.target.value)}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]}
            placeholder="Todas"
          />
          <Select
            label="Tipo"
            value={filters.tipoIngresoId}
            onChange={(e) => handleFilterChange('tipoIngresoId', e.target.value)}
            options={tiposIngreso.map((t: any) => ({ value: t.id || t.TipoIngresoId, label: t.nombre || t.TipoIngresoNombre }))}
            placeholder="Todos"
          />
          <div className="flex-1 min-w-[180px]">
            <Input
              label="Buscar"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Observación..."
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={ingresos} />
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          pageSize={pageSize}
          total={pagination.total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </Card>

      <Modal open={showModal} onClose={() => { setShowModal(false); setFormErrors({}); }} title="Nuevo Ingreso">
        <div className="space-y-4">
          <div>
            <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => { setForm({ ...form, fecha: e.target.value }); clearFieldError('fecha'); }} />
            {formErrors.fecha && <p className="text-sm text-red-500 mt-1">{formErrors.fecha}</p>}
          </div>
          <div>
            <Select
              label="Tipo de Ingreso"
              value={form.tipoIngresoId}
              onChange={(e) => { setForm({ ...form, tipoIngresoId: e.target.value }); clearFieldError('tipoIngresoId'); }}
              options={tiposIngreso.map((t: any) => ({ value: t.id || t.TipoIngresoId, label: t.nombre || t.TipoIngresoNombre }))}
              placeholder="Seleccionar tipo"
            />
            {formErrors.tipoIngresoId && <p className="text-sm text-red-500 mt-1">{formErrors.tipoIngresoId}</p>}
          </div>
          <Select
            label="Cliente (opcional)"
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))}
            placeholder="Seleccionar cliente"
          />
          <div>
            <Select
              label="Caja"
              value={form.cajaId}
              onChange={(e) => { setForm({ ...form, cajaId: e.target.value }); clearFieldError('cajaId'); }}
              options={cajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))}
              placeholder="Seleccionar caja"
            />
            {formErrors.cajaId && <p className="text-sm text-red-500 mt-1">{formErrors.cajaId}</p>}
          </div>
          <Select
            label="Moneda"
            value={form.monedaId}
            onChange={(e) => setForm({ ...form, monedaId: e.target.value })}
            options={[{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }]}
          />
          <div>
            <Input label="Importe" type="number" step="0.01" value={form.importe} onChange={(e) => { setForm({ ...form, importe: e.target.value }); clearFieldError('importe'); }} placeholder="0.00" />
            {formErrors.importe && <p className="text-sm text-red-500 mt-1">{formErrors.importe}</p>}
          </div>
          <Input label="Observacion" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} placeholder="Observacion (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setFormErrors({}); }}>Cancelar</Button>
            <Button variant="success" loading={saving} onClick={handleCreate}>Registrar Ingreso</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
