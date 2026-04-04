import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cajasApi } from '../api/cajas';
import { ingresosApi } from '../api/ingresos';
import { egresosApi } from '../api/egresos';
import { transferenciasApi } from '../api/transferencias';
import { conversionesApi } from '../api/conversiones';
import { facturasApi } from '../api/facturas';
import { facturasGastoApi } from '../api/facturas-gasto';
import { catalogosApi } from '../api/catalogos';
import { clientesApi } from '../api/clientes';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import Table from '../components/ui/Table';
import MoneyInput from '../components/shared/MoneyInput';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { Movimiento } from '../types/caja';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, RefreshCw, FileText, FileDown, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type ModalType = 'ingreso' | 'egreso' | 'transferencia' | 'conversion' | 'factura' | 'facturaGasto' | null;

const defaultFormIngreso = { fecha: new Date().toISOString().split('T')[0], tipoIngresoId: '', clienteId: '', observacion: '', monedaId: '1', importe: 0 };
const defaultFormEgreso = { fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', observacion: '', monedaId: '1', importe: 0 };

export default function CajaDetalle() {
  const { id } = useParams();
  const cajaId = Number(id);
  const navigate = useNavigate();

  const [caja, setCaja] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [editingMovimiento, setEditingMovimiento] = useState<Movimiento | null>(null);
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [tiposEgreso, setTiposEgreso] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);

  const [formIngreso, setFormIngreso] = useState({ ...defaultFormIngreso });
  const [formEgreso, setFormEgreso] = useState({ ...defaultFormEgreso });
  const [formTransferencia, setFormTransferencia] = useState({ fecha: new Date().toISOString().split('T')[0], cajaDestinoId: '', monedaId: '1', importe: 0 });
  const [formConversion, setFormConversion] = useState({ monedaOrigenId: '1', monedaDestinoId: '2', tipoCambio: 0, importe: 0 });
  const [formFactura, setFormFactura] = useState({ fecha: new Date().toISOString().split('T')[0], clienteId: '', importe: 0, monedaId: '1', observacion: '' });
  const [formFacturaGasto, setFormFacturaGasto] = useState({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', importe: 0, monedaId: '1', observacion: '', fechaVencimiento: '' });

  useEffect(() => { loadData(); }, [cajaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cajaRes, movRes] = await Promise.all([
        cajasApi.getById(cajaId),
        cajasApi.getMovimientos(cajaId, 1, 50),
      ]);
      const cajaData = (cajaRes.data as any)?.data || cajaRes.data;
      setCaja(cajaData);
      const movData = (movRes.data as any)?.data || movRes.data;
      setMovimientos(movData?.data || movData || []);

      const [tiRes, teRes, clRes, cRes] = await Promise.all([
        catalogosApi.getTiposIngreso(),
        catalogosApi.getTiposEgreso(),
        clientesApi.getAll(),
        cajasApi.getAll(),
      ]);
      setTiposIngreso(tiRes.data || []);
      setTiposEgreso(teRes.data || []);
      setClientes(clRes.data || []);
      setCajas(((cRes.data as any)?.data || cRes.data || []) as any[]);
    } catch {} finally { setLoading(false); }
  };

  const reloadMovimientos = async () => {
    try {
      const movRes = await cajasApi.getMovimientos(cajaId, 1, 50);
      const movData = (movRes.data as any)?.data || movRes.data;
      setMovimientos(movData?.data || movData || []);
      const cajaRes = await cajasApi.getById(cajaId);
      setCaja((cajaRes.data as any)?.data || cajaRes.data);
    } catch {}
  };

  const openEditIngreso = async (mov: Movimiento) => {
    try {
      const res = await ingresosApi.getById(mov.id);
      const data = (res.data as any)?.data || res.data;
      setEditingMovimiento(mov);
      setFormIngreso({
        fecha: data.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
        tipoIngresoId: String(data.tipoIngresoId || data.TipoIngresoId || ''),
        clienteId: data.clienteId ? String(data.clienteId) : '',
        observacion: data.observacion || '',
        monedaId: String(data.monedaId || data.MonedaId || '1'),
        importe: Math.abs(Number(data.importe || data.IngresoImporte || mov.importe)),
      });
      setActiveModal('ingreso');
    } catch (err: any) {
      toast.error('Error al cargar ingreso');
    }
  };

  const openEditEgreso = async (mov: Movimiento) => {
    try {
      const res = await egresosApi.getById(mov.id);
      const data = (res.data as any)?.data || res.data;
      setEditingMovimiento(mov);
      setFormEgreso({
        fecha: data.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
        tipoEgresoId: String(data.tipoEgresoId || data.TipoEgresoId || ''),
        observacion: data.observacion || '',
        monedaId: String(data.monedaId || data.MonedaId || '1'),
        importe: Math.abs(Number(data.importe || data.EgresoImporte || mov.importe)),
      });
      setActiveModal('egreso');
    } catch (err: any) {
      toast.error('Error al cargar egreso');
    }
  };

  const handleIngreso = async () => {
    setSaving(true);
    try {
      if (editingMovimiento) {
        await ingresosApi.update(editingMovimiento.id, {
          fecha: formIngreso.fecha,
          tipoIngresoId: parseInt(formIngreso.tipoIngresoId),
          clienteId: formIngreso.clienteId ? parseInt(formIngreso.clienteId) : undefined,
          observacion: formIngreso.observacion,
          monedaId: parseInt(formIngreso.monedaId),
          importe: formIngreso.importe,
        });
        toast.success('Ingreso actualizado');
      } else {
        await ingresosApi.create({
          fecha: formIngreso.fecha,
          tipoIngresoId: parseInt(formIngreso.tipoIngresoId),
          clienteId: formIngreso.clienteId ? parseInt(formIngreso.clienteId) : undefined,
          observacion: formIngreso.observacion,
          monedaId: parseInt(formIngreso.monedaId),
          importe: formIngreso.importe,
          cajaId,
        });
        toast.success('Ingreso registrado');
      }
      setActiveModal(null);
      setEditingMovimiento(null);
      setFormIngreso({ ...defaultFormIngreso });
      reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleEgreso = async () => {
    setSaving(true);
    try {
      if (editingMovimiento) {
        await egresosApi.update(editingMovimiento.id, {
          fecha: formEgreso.fecha,
          tipoEgresoId: parseInt(formEgreso.tipoEgresoId),
          observacion: formEgreso.observacion,
          monedaId: parseInt(formEgreso.monedaId),
          importe: formEgreso.importe,
        });
        toast.success('Egreso actualizado');
      } else {
        await egresosApi.create({
          fecha: formEgreso.fecha,
          tipoEgresoId: parseInt(formEgreso.tipoEgresoId),
          observacion: formEgreso.observacion,
          monedaId: parseInt(formEgreso.monedaId),
          importe: formEgreso.importe,
          cajaId,
        });
        toast.success('Egreso registrado');
      }
      setActiveModal(null);
      setEditingMovimiento(null);
      setFormEgreso({ ...defaultFormEgreso });
      reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedMovimiento) return;
    setSaving(true);
    try {
      if (selectedMovimiento.tipo === 'ingreso') {
        await ingresosApi.delete(selectedMovimiento.id);
        toast.success('Ingreso eliminado');
      } else {
        await egresosApi.delete(selectedMovimiento.id);
        toast.success('Egreso eliminado');
      }
      setSelectedMovimiento(null);
      setShowDeleteConfirm(false);
      reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleEditFromDetail = () => {
    if (!selectedMovimiento) return;
    const mov = selectedMovimiento;
    setSelectedMovimiento(null);
    if (mov.tipo === 'ingreso') {
      openEditIngreso(mov);
    } else {
      openEditEgreso(mov);
    }
  };

  const handleTransferencia = async () => {
    setSaving(true);
    try {
      await transferenciasApi.create({ fecha: formTransferencia.fecha, cajaOrigenId: cajaId, cajaDestinoId: parseInt(formTransferencia.cajaDestinoId), monedaId: parseInt(formTransferencia.monedaId), importe: formTransferencia.importe });
      toast.success('Transferencia registrada'); setActiveModal(null); setFormTransferencia({ fecha: new Date().toISOString().split('T')[0], cajaDestinoId: '', monedaId: '1', importe: 0 }); reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleConversion = async () => {
    setSaving(true);
    try {
      const importeDestino = Math.round(formConversion.importe * formConversion.tipoCambio * 100) / 100;
      await conversionesApi.create({ cajaId, monedaOrigenId: parseInt(formConversion.monedaOrigenId), monedaDestinoId: parseInt(formConversion.monedaDestinoId), tipoCambio: formConversion.tipoCambio, importeOrigen: formConversion.importe, importeDestino });
      toast.success('Conversion registrada'); setActiveModal(null); setFormConversion({ monedaOrigenId: '1', monedaDestinoId: '2', tipoCambio: 0, importe: 0 }); reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleFactura = async () => {
    setSaving(true);
    try {
      await facturasApi.create({ fecha: formFactura.fecha, clienteId: parseInt(formFactura.clienteId), importe: formFactura.importe, monedaId: parseInt(formFactura.monedaId), observacion: formFactura.observacion });
      toast.success('Factura creada'); setActiveModal(null); setFormFactura({ fecha: new Date().toISOString().split('T')[0], clienteId: '', importe: 0, monedaId: '1', observacion: '' });
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleFacturaGasto = async () => {
    setSaving(true);
    try {
      await facturasGastoApi.create({ fecha: formFacturaGasto.fecha, tipoEgresoId: parseInt(formFacturaGasto.tipoEgresoId), importe: formFacturaGasto.importe, monedaId: parseInt(formFacturaGasto.monedaId), observacion: formFacturaGasto.observacion, fechaVencimiento: formFacturaGasto.fechaVencimiento || undefined });
      toast.success('Factura de gasto creada'); setActiveModal(null); setFormFacturaGasto({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', importe: 0, monedaId: '1', observacion: '', fechaVencimiento: '' });
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const closeIngresoModal = () => {
    setActiveModal(null);
    setEditingMovimiento(null);
    setFormIngreso({ ...defaultFormIngreso });
  };

  const closeEgresoModal = () => {
    setActiveModal(null);
    setEditingMovimiento(null);
    setFormEgreso({ ...defaultFormEgreso });
  };

  const monedaOpts = [{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }];
  const otrasCajas = cajas.filter((c: any) => (c.id || c.CajaId) !== cajaId);

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (mov: Movimiento) => formatDate(mov.fecha),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (mov: Movimiento) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${mov.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
          {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
        </span>
      ),
    },
    {
      key: 'concepto',
      header: 'Concepto',
    },
    {
      key: 'observacion',
      header: 'Observacion',
      render: (mov: Movimiento) => mov.observacion || '-',
    },
    {
      key: 'importe',
      header: 'Importe',
      render: (mov: Movimiento) => (
        <span className={`font-semibold ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
          {mov.tipo === 'ingreso' ? '+' : '-'}{formatMoney(Math.abs(mov.importe), mov.moneda)}
        </span>
      ),
    },
  ];

  if (loading) return <Spinner />;
  if (!caja) return <p>Caja no encontrada</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{caja.nombre}</h1>
          <div className="flex gap-4 mt-1">
            {caja.saldos?.map((s: any) => (
              <span key={s.monedaId} className="text-sm font-medium">
                {s.moneda}: <span className={s.saldo > 0 ? 'text-emerald-600' : s.saldo < 0 ? 'text-red-600' : 'text-gray-400'}>
                  {formatMoney(s.saldo, MONEDA_SYMBOLS[s.monedaId] || s.moneda)}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="success" onClick={() => { setEditingMovimiento(null); setFormIngreso({ ...defaultFormIngreso }); setActiveModal('ingreso'); }}><ArrowDownCircle size={16} className="mr-1" /> Ingreso</Button>
        <Button variant="danger" onClick={() => { setEditingMovimiento(null); setFormEgreso({ ...defaultFormEgreso }); setActiveModal('egreso'); }}><ArrowUpCircle size={16} className="mr-1" /> Egreso</Button>
        <Button onClick={() => setActiveModal('transferencia')}><ArrowRightLeft size={16} className="mr-1" /> Transferir</Button>
        <Button variant="secondary" onClick={() => setActiveModal('conversion')}><RefreshCw size={16} className="mr-1" /> Convertir</Button>
        <Button variant="ghost" onClick={() => setActiveModal('factura')}><FileText size={16} className="mr-1" /> Factura Cobrar</Button>
        <Button variant="ghost" onClick={() => setActiveModal('facturaGasto')}><FileDown size={16} className="mr-1" /> Factura Pagar</Button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300">Movimientos</h2>
        </div>
        {movimientos.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-4">Sin movimientos</p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table<Movimiento> columns={columns} data={movimientos} onRowClick={(mov) => setSelectedMovimiento(mov)} />
            </div>
            <div className="md:hidden space-y-1">
              {movimientos.map((mov) => (
                <div
                  key={`${mov.tipo}-${mov.id}`}
                  className="py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer active:bg-gray-100 dark:active:bg-gray-600"
                  onClick={() => setSelectedMovimiento(mov)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(mov.fecha)}</span>
                    <span className={`font-semibold text-sm whitespace-nowrap ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'}{formatMoney(Math.abs(mov.importe), mov.moneda)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate mr-2">{mov.concepto}</span>
                  </div>
                  {mov.observacion && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{mov.observacion}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={!!selectedMovimiento && !showDeleteConfirm}
        onClose={() => setSelectedMovimiento(null)}
        title="Detalle del movimiento"
      >
        {selectedMovimiento && (
          <div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(selectedMovimiento.fecha)}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{selectedMovimiento.concepto}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${selectedMovimiento.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                  {selectedMovimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </span>
              </div>
              <div className="text-center py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className={`text-2xl font-bold ${selectedMovimiento.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedMovimiento.tipo === 'ingreso' ? '+' : '-'}{formatMoney(Math.abs(selectedMovimiento.importe), selectedMovimiento.moneda)}
                </span>
              </div>
              {selectedMovimiento.observacion && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Observacion</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMovimiento.observacion}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} className="mr-1" /> Eliminar
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleEditFromDetail}>
                <Pencil size={16} className="mr-1" /> Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar movimiento"
        message={`¿Eliminar este ${selectedMovimiento?.tipo === 'ingreso' ? 'ingreso' : 'egreso'} de ${selectedMovimiento ? formatMoney(Math.abs(selectedMovimiento.importe), selectedMovimiento.moneda) : ''}?`}
        loading={saving}
      />

      <Modal open={activeModal === 'ingreso'} onClose={closeIngresoModal} title={editingMovimiento ? 'Editar Ingreso' : 'Registrar Ingreso'}>
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formIngreso.fecha} onChange={(e) => setFormIngreso({ ...formIngreso, fecha: e.target.value })} />
          <Select label="Tipo de Ingreso" value={formIngreso.tipoIngresoId} onChange={(e) => setFormIngreso({ ...formIngreso, tipoIngresoId: e.target.value })} options={tiposIngreso.map((t: any) => ({ value: t.id || t.TipoIngresoId, label: t.nombre || t.TipoIngresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Cliente (opcional)" value={formIngreso.clienteId} onChange={(e) => setFormIngreso({ ...formIngreso, clienteId: e.target.value })} options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))} placeholder="Seleccionar cliente" />
          <Select label="Moneda" value={formIngreso.monedaId} onChange={(e) => setFormIngreso({ ...formIngreso, monedaId: e.target.value })} options={monedaOpts} />
          <MoneyInput label="Importe" value={formIngreso.importe} onChange={(val) => setFormIngreso({ ...formIngreso, importe: val })} />
          <Input label="Observacion" value={formIngreso.observacion} onChange={(e) => setFormIngreso({ ...formIngreso, observacion: e.target.value })} placeholder="Opcional" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={closeIngresoModal}>Cancelar</Button>
            <Button variant="success" loading={saving} onClick={handleIngreso}>{editingMovimiento ? 'Guardar' : 'Registrar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'egreso'} onClose={closeEgresoModal} title={editingMovimiento ? 'Editar Egreso' : 'Registrar Egreso'}>
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formEgreso.fecha} onChange={(e) => setFormEgreso({ ...formEgreso, fecha: e.target.value })} />
          <Select label="Tipo de Egreso" value={formEgreso.tipoEgresoId} onChange={(e) => setFormEgreso({ ...formEgreso, tipoEgresoId: e.target.value })} options={tiposEgreso.map((t: any) => ({ value: t.id || t.TipoEgresoId, label: t.nombre || t.TipoEgresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Moneda" value={formEgreso.monedaId} onChange={(e) => setFormEgreso({ ...formEgreso, monedaId: e.target.value })} options={monedaOpts} />
          <MoneyInput label="Importe" value={formEgreso.importe} onChange={(val) => setFormEgreso({ ...formEgreso, importe: val })} />
          <Input label="Observacion" value={formEgreso.observacion} onChange={(e) => setFormEgreso({ ...formEgreso, observacion: e.target.value })} placeholder="Opcional" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={closeEgresoModal}>Cancelar</Button>
            <Button variant="danger" loading={saving} onClick={handleEgreso}>{editingMovimiento ? 'Guardar' : 'Registrar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'transferencia'} onClose={() => setActiveModal(null)} title="Transferir a otra Caja">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formTransferencia.fecha} onChange={(e) => setFormTransferencia({ ...formTransferencia, fecha: e.target.value })} />
          <Select label="Caja Destino" value={formTransferencia.cajaDestinoId} onChange={(e) => setFormTransferencia({ ...formTransferencia, cajaDestinoId: e.target.value })} options={otrasCajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja destino" />
          <Select label="Moneda" value={formTransferencia.monedaId} onChange={(e) => setFormTransferencia({ ...formTransferencia, monedaId: e.target.value })} options={monedaOpts} />
          <MoneyInput label="Importe" value={formTransferencia.importe} onChange={(val) => setFormTransferencia({ ...formTransferencia, importe: val })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleTransferencia}><ArrowRightLeft size={16} className="mr-1" /> Transferir</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'conversion'} onClose={() => setActiveModal(null)} title="Convertir Moneda">
        <div className="space-y-4">
          <Select label="Moneda Origen" value={formConversion.monedaOrigenId} onChange={(e) => setFormConversion({ ...formConversion, monedaOrigenId: e.target.value })} options={monedaOpts} />
          <Select label="Moneda Destino" value={formConversion.monedaDestinoId} onChange={(e) => setFormConversion({ ...formConversion, monedaDestinoId: e.target.value })} options={monedaOpts} />
          <MoneyInput label="Tipo de Cambio" value={formConversion.tipoCambio} onChange={(val) => setFormConversion({ ...formConversion, tipoCambio: val })} />
          <MoneyInput label="Importe Origen" value={formConversion.importe} onChange={(val) => setFormConversion({ ...formConversion, importe: val })} />
          {formConversion.importe > 0 && formConversion.tipoCambio > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Equivalente: <span className="font-semibold">{formatMoney(formConversion.importe * formConversion.tipoCambio)}</span></p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="secondary" loading={saving} onClick={handleConversion}><RefreshCw size={16} className="mr-1" /> Convertir</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'factura'} onClose={() => setActiveModal(null)} title="Nueva Factura a Cobrar">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formFactura.fecha} onChange={(e) => setFormFactura({ ...formFactura, fecha: e.target.value })} />
          <Select label="Cliente" value={formFactura.clienteId} onChange={(e) => setFormFactura({ ...formFactura, clienteId: e.target.value })} options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))} placeholder="Seleccionar cliente" />
          <Select label="Moneda" value={formFactura.monedaId} onChange={(e) => setFormFactura({ ...formFactura, monedaId: e.target.value })} options={monedaOpts} />
          <MoneyInput label="Importe" value={formFactura.importe} onChange={(val) => setFormFactura({ ...formFactura, importe: val })} />
          <Input label="Observacion" value={formFactura.observacion} onChange={(e) => setFormFactura({ ...formFactura, observacion: e.target.value })} placeholder="Opcional" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleFactura}>Crear Factura</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'facturaGasto'} onClose={() => setActiveModal(null)} title="Nueva Factura a Pagar">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formFacturaGasto.fecha} onChange={(e) => setFormFacturaGasto({ ...formFacturaGasto, fecha: e.target.value })} />
          <Select label="Tipo de Egreso" value={formFacturaGasto.tipoEgresoId} onChange={(e) => setFormFacturaGasto({ ...formFacturaGasto, tipoEgresoId: e.target.value })} options={tiposEgreso.map((t: any) => ({ value: t.id || t.TipoEgresoId, label: t.nombre || t.TipoEgresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Moneda" value={formFacturaGasto.monedaId} onChange={(e) => setFormFacturaGasto({ ...formFacturaGasto, monedaId: e.target.value })} options={monedaOpts} />
          <MoneyInput label="Importe" value={formFacturaGasto.importe} onChange={(val) => setFormFacturaGasto({ ...formFacturaGasto, importe: val })} />
          <Input label="Fecha Vencimiento" type="date" value={formFacturaGasto.fechaVencimiento} onChange={(e) => setFormFacturaGasto({ ...formFacturaGasto, fechaVencimiento: e.target.value })} />
          <Input label="Observacion" value={formFacturaGasto.observacion} onChange={(e) => setFormFacturaGasto({ ...formFacturaGasto, observacion: e.target.value })} placeholder="Opcional" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleFacturaGasto}>Crear Factura</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
