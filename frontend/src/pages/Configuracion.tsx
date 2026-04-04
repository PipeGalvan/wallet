import { useEffect, useState } from 'react';
import { cajasApi } from '../api/cajas';
import { catalogosApi } from '../api/catalogos';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'tipos-ingreso' | 'tipos-egreso' | 'cajas';

export default function Configuracion() {
  const [tab, setTab] = useState<Tab>('tipos-ingreso');
  const [tiposIngreso, setTiposIngreso] = useState<any[]>([]);
  const [tiposEgreso, setTiposEgreso] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tiRes, teRes, cajasRes] = await Promise.all([
        catalogosApi.getTiposIngreso({ all: true }),
        catalogosApi.getTiposEgreso({ all: true }),
        cajasApi.getAll(),
      ]);
      setTiposIngreso(tiRes.data || []);
      setTiposEgreso(teRes.data || []);
      setCajas(((cajasRes.data as any).data || cajasRes.data) || []);
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ nombre: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditId(item.id || item.TipoIngresoId || item.TipoEgresoId || item.CajaId);
    setForm({ nombre: item.nombre || item.TipoIngresoNombre || item.TipoEgresoNombre || item.CajaNombre || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'tipos-ingreso') {
        if (editId) await catalogosApi.updateTipoIngreso(editId, { nombre: form.nombre });
        else await catalogosApi.createTipoIngreso({ nombre: form.nombre });
      } else if (tab === 'tipos-egreso') {
        if (editId) await catalogosApi.updateTipoEgreso(editId, { nombre: form.nombre });
        else await catalogosApi.createTipoEgreso({ nombre: form.nombre });
      } else if (tab === 'cajas') {
        if (editId) await cajasApi.update(editId, { nombre: form.nombre });
        else await cajasApi.create({ nombre: form.nombre, fecha: new Date().toISOString().split('T')[0] });
      }
      toast.success(editId ? 'Actualizado' : 'Creado');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleToggle = async (item: any) => {
    const id = item.id || item.TipoIngresoId || item.TipoEgresoId || item.CajaId;
    const isCurrentlyActive = getActive(item);
    const newState = !isCurrentlyActive;
    setToggling(id);
    try {
      if (tab === 'tipos-ingreso') {
        await catalogosApi.updateTipoIngreso(id, { nombre: getName(item), activo: newState });
      } else if (tab === 'tipos-egreso') {
        await catalogosApi.updateTipoEgreso(id, { nombre: getName(item), activo: newState });
      } else if (tab === 'cajas') {
        await cajasApi.update(id, { activo: newState });
      }
      toast.success(newState ? 'Activado' : 'Desactivado');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally { setToggling(null); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tipos-ingreso', label: 'Tipos de Ingreso' },
    { key: 'tipos-egreso', label: 'Tipos de Egreso' },
    { key: 'cajas', label: 'Cajas' },
  ];

  const currentItems = tab === 'tipos-ingreso' ? tiposIngreso : tab === 'tipos-egreso' ? tiposEgreso : cajas;

  const getName = (item: any) => item.nombre || item.TipoIngresoNombre || item.TipoEgresoNombre || item.CajaNombre || '-';

  const getActive = (item: any) => {
    const val = item.activo !== undefined ? item.activo : item.TipoIngresoActivo !== undefined ? item.TipoIngresoActivo : item.TipoEgresoActivo;
    return val !== false;
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuracion</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary-600 text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Nombre</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item: any) => {
                const id = item.id || item.TipoIngresoId || item.TipoEgresoId || item.CajaId;
                const isActive = getActive(item);
                const isTogglingThis = toggling === id;
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">{getName(item)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleToggle(item)}
                          disabled={isTogglingThis}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                          } ${isTogglingThis ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => openEdit(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-gray-400 dark:text-gray-500">No hay elementos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar' : 'Nuevo'}>
        <div className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ nombre: e.target.value })} placeholder="Ingrese nombre" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
