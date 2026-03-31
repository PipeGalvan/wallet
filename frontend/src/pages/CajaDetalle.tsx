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
import { formatMoney, formatDate } from '../utils/format';
import { MONEDA_SYMBOLS } from '../utils/constants';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, RefreshCw, FileText, FileDown, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Movimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  fecha: string;
  concepto: string;
  observacion: string;
  importe: number;
  moneda: string;
  cliente: string | null;
}

type ModalType = 'ingreso' | 'egreso' | 'transferencia' | 'conversion' | 'factura' | 'facturaGasto' | null;

export default function CajaDetalle() {
  const { id } = useParams();
  const cajaId = Number(id);
  const navigate = useNavigate();

  const [caja, setCaja] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [tiposEgreso, setTiposEgreso] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);

  const [formIngreso, setFormIngreso] = useState({ fecha: new Date().toISOString().split('T')[0], tipoIngresoId: '', clienteId: '', observacion: '', monedaId: '1', importe: '' });
  const [formEgreso, setFormEgreso] = useState({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', observacion: '', monedaId: '1', importe: '' });
  const [formTransferencia, setFormTransferencia] = useState({ fecha: new Date().toISOString().split('T')[0], cajaDestinoId: '', monedaId: '1', importe: '' });
  const [formConversion, setFormConversion] = useState({ monedaOrigenId: '1', monedaDestinoId: '2', tipoCambio: '', importe: '' });
  const [formFactura, setFormFactura] = useState({ fecha: new Date().toISOString().split('T')[0], clienteId: '', importe: '', monedaId: '1', observacion: '' });
  const [formFacturaGasto, setFormFacturaGasto] = useState({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', importe: '', monedaId: '1', observacion: '', fechaVencimiento: '' });

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

  const handleIngreso = async () => {
    setSaving(true);
    try {
      await ingresosApi.create({ fecha: formIngreso.fecha, tipoIngresoId: parseInt(formIngreso.tipoIngresoId), clienteId: formIngreso.clienteId ? parseInt(formIngreso.clienteId) : undefined, observacion: formIngreso.observacion, monedaId: parseInt(formIngreso.monedaId), importe: parseFloat(formIngreso.importe), cajaId });
      toast.success('Ingreso registrado'); setActiveModal(null); setFormIngreso({ fecha: new Date().toISOString().split('T')[0], tipoIngresoId: '', clienteId: '', observacion: '', monedaId: '1', importe: '' }); reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleEgreso = async () => {
    setSaving(true);
    try {
      await egresosApi.create({ fecha: formEgreso.fecha, tipoEgresoId: parseInt(formEgreso.tipoEgresoId), observacion: formEgreso.observacion, monedaId: parseInt(formEgreso.monedaId), importe: parseFloat(formEgreso.importe), cajaId });
      toast.success('Egreso registrado'); setActiveModal(null); setFormEgreso({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', observacion: '', monedaId: '1', importe: '' }); reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleTransferencia = async () => {
    setSaving(true);
    try {
      await transferenciasApi.create({ fecha: formTransferencia.fecha, cajaOrigenId: cajaId, cajaDestinoId: parseInt(formTransferencia.cajaDestinoId), monedaId: parseInt(formTransferencia.monedaId), importe: parseFloat(formTransferencia.importe) });
      toast.success('Transferencia registrada'); setActiveModal(null); setFormTransferencia({ fecha: new Date().toISOString().split('T')[0], cajaDestinoId: '', monedaId: '1', importe: '' }); reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleConversion = async () => {
    setSaving(true);
    try {
      const importeOrigen = parseFloat(formConversion.importe);
      const tipoCambio = parseFloat(formConversion.tipoCambio);
      const importeDestino = Math.round(importeOrigen * tipoCambio * 100) / 100;
      await conversionesApi.create({ cajaId, monedaOrigenId: parseInt(formConversion.monedaOrigenId), monedaDestinoId: parseInt(formConversion.monedaDestinoId), tipoCambio, importeOrigen, importeDestino });
      toast.success('Conversion registrada'); setActiveModal(null); setFormConversion({ monedaOrigenId: '1', monedaDestinoId: '2', tipoCambio: '', importe: '' }); reloadMovimientos();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleFactura = async () => {
    setSaving(true);
    try {
      await facturasApi.create({ fecha: formFactura.fecha, clienteId: parseInt(formFactura.clienteId), importe: parseFloat(formFactura.importe), monedaId: parseInt(formFactura.monedaId), observacion: formFactura.observacion });
      toast.success('Factura creada'); setActiveModal(null); setFormFactura({ fecha: new Date().toISOString().split('T')[0], clienteId: '', importe: '', monedaId: '1', observacion: '' });
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const handleFacturaGasto = async () => {
    setSaving(true);
    try {
      await facturasGastoApi.create({ fecha: formFacturaGasto.fecha, tipoEgresoId: parseInt(formFacturaGasto.tipoEgresoId), importe: parseFloat(formFacturaGasto.importe), monedaId: parseInt(formFacturaGasto.monedaId), observacion: formFacturaGasto.observacion, fechaVencimiento: formFacturaGasto.fechaVencimiento || undefined });
      toast.success('Factura de gasto creada'); setActiveModal(null); setFormFacturaGasto({ fecha: new Date().toISOString().split('T')[0], tipoEgresoId: '', importe: '', monedaId: '1', observacion: '', fechaVencimiento: '' });
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Error'); } finally { setSaving(false); }
  };

  const monedaOpts = [{ value: 1, label: '$ (ARS)' }, { value: 2, label: 'USD' }];
  const otrasCajas = cajas.filter((c: any) => (c.id || c.CajaId) !== cajaId);

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
        <Button variant="success" onClick={() => setActiveModal('ingreso')}><ArrowDownCircle size={16} className="mr-1" /> Ingreso</Button>
        <Button variant="danger" onClick={() => setActiveModal('egreso')}><ArrowUpCircle size={16} className="mr-1" /> Egreso</Button>
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
          <div className="space-y-1">
            {movimientos.map((mov) => (
              <div key={`${mov.tipo}-${mov.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}>
                      {mov.tipo === 'ingreso' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                    </span>
                    <span className="font-medium text-sm">{mov.concepto}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDate(mov.fecha)}{mov.observacion && ` - ${mov.observacion}`}
                  </p>
                </div>
                <span className={`font-semibold ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatMoney(Math.abs(mov.importe), mov.moneda)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={activeModal === 'ingreso'} onClose={() => setActiveModal(null)} title="Registrar Ingreso">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formIngreso.fecha} onChange={(e) => setFormIngreso({ ...formIngreso, fecha: e.target.value })} />
          <Select label="Tipo de Ingreso" value={formIngreso.tipoIngresoId} onChange={(e) => setFormIngreso({ ...formIngreso, tipoIngresoId: e.target.value })} options={tiposIngreso.map((t: any) => ({ value: t.id || t.TipoIngresoId, label: t.nombre || t.TipoIngresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Cliente (opcional)" value={formIngreso.clienteId} onChange={(e) => setFormIngreso({ ...formIngreso, clienteId: e.target.value })} options={clientes.map((c: any) => ({ value: c.id || c.ClienteId, label: c.nombre || c.ClienteNombre }))} placeholder="Seleccionar cliente" />
          <Select label="Moneda" value={formIngreso.monedaId} onChange={(e) => setFormIngreso({ ...formIngreso, monedaId: e.target.value })} options={monedaOpts} />
          <Input label="Importe" type="number" step="0.01" value={formIngreso.importe} onChange={(e) => setFormIngreso({ ...formIngreso, importe: e.target.value })} placeholder="0.00" />
          <Input label="Observacion" value={formIngreso.observacion} onChange={(e) => setFormIngreso({ ...formIngreso, observacion: e.target.value })} placeholder="Opcional" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="success" loading={saving} onClick={handleIngreso}>Registrar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'egreso'} onClose={() => setActiveModal(null)} title="Registrar Egreso">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formEgreso.fecha} onChange={(e) => setFormEgreso({ ...formEgreso, fecha: e.target.value })} />
          <Select label="Tipo de Egreso" value={formEgreso.tipoEgresoId} onChange={(e) => setFormEgreso({ ...formEgreso, tipoEgresoId: e.target.value })} options={tiposEgreso.map((t: any) => ({ value: t.id || t.TipoEgresoId, label: t.nombre || t.TipoEgresoNombre }))} placeholder="Seleccionar tipo" />
          <Select label="Moneda" value={formEgreso.monedaId} onChange={(e) => setFormEgreso({ ...formEgreso, monedaId: e.target.value })} options={monedaOpts} />
          <Input label="Importe" type="number" step="0.01" value={formEgreso.importe} onChange={(e) => setFormEgreso({ ...formEgreso, importe: e.target.value })} placeholder="0.00" />
          <Input label="Observacion" value={formEgreso.observacion} onChange={(e) => setFormEgreso({ ...formEgreso, observacion: e.target.value })} placeholder="Opcional" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="danger" loading={saving} onClick={handleEgreso}>Registrar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'transferencia'} onClose={() => setActiveModal(null)} title="Transferir a otra Caja">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={formTransferencia.fecha} onChange={(e) => setFormTransferencia({ ...formTransferencia, fecha: e.target.value })} />
          <Select label="Caja Destino" value={formTransferencia.cajaDestinoId} onChange={(e) => setFormTransferencia({ ...formTransferencia, cajaDestinoId: e.target.value })} options={otrasCajas.map((c: any) => ({ value: c.id || c.CajaId, label: c.nombre || c.CajaNombre }))} placeholder="Seleccionar caja destino" />
          <Select label="Moneda" value={formTransferencia.monedaId} onChange={(e) => setFormTransferencia({ ...formTransferencia, monedaId: e.target.value })} options={monedaOpts} />
          <Input label="Importe" type="number" step="0.01" value={formTransferencia.importe} onChange={(e) => setFormTransferencia({ ...formTransferencia, importe: e.target.value })} placeholder="0.00" />
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
          <Input label="Tipo de Cambio" type="number" step="0.000001" value={formConversion.tipoCambio} onChange={(e) => setFormConversion({ ...formConversion, tipoCambio: e.target.value })} placeholder="Ej: 1200.50" />
          <Input label="Importe Origen" type="number" step="0.01" value={formConversion.importe} onChange={(e) => setFormConversion({ ...formConversion, importe: e.target.value })} placeholder="0.00" />
          {formConversion.importe && formConversion.tipoCambio && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Equivalente: <span className="font-semibold">{formatMoney(parseFloat(formConversion.importe) * parseFloat(formConversion.tipoCambio))}</span></p>
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
          <Input label="Importe" type="number" step="0.01" value={formFactura.importe} onChange={(e) => setFormFactura({ ...formFactura, importe: e.target.value })} placeholder="0.00" />
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
          <Input label="Importe" type="number" step="0.01" value={formFacturaGasto.importe} onChange={(e) => setFormFacturaGasto({ ...formFacturaGasto, importe: e.target.value })} placeholder="0.00" />
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
