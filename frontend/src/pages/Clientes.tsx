import { useEffect, useState } from 'react';
import { clientesApi } from '../api/clientes';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editObservaciones, setEditObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    try {
      const { data } = await clientesApi.getAll();
      setClientes((data as any).data || data);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await clientesApi.create({ nombre, observaciones });
      toast.success('Cliente creado');
      setShowModal(false);
      setNombre('');
      setObservaciones('');
      loadClientes();
    } catch (err: any) {
      toast.error('Error al crear cliente');
    } finally { setSaving(false); }
  };

  const handleEdit = (c: any) => {
    setEditId(c.id || c.ClienteId);
    setEditNombre(c.ClienteNombre || c.nombre);
    setEditObservaciones(c.ClienteObservaciones || c.observaciones || '');
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await clientesApi.update(editId, { nombre: editNombre, observaciones: editObservaciones });
      toast.success('Cliente actualizado');
      setShowEditModal(false);
      setEditId(null);
      loadClientes();
    } catch (err: any) {
      toast.error('Error al actualizar cliente');
    } finally { setSaving(false); }
  };

  const handleDelete = async (c: any) => {
    const id = c.id || c.ClienteId;
    const nombreCliente = c.ClienteNombre || c.nombre;
    if (!window.confirm(`¿Eliminar cliente "${nombreCliente}"?`)) return;
    try {
      await clientesApi.delete(id);
      toast.success('Cliente eliminado');
      loadClientes();
    } catch (err: any) {
      toast.error('Error al eliminar cliente');
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre', render: (c: any) => c.ClienteNombre || c.nombre },
    { key: 'observaciones', header: 'Observaciones', render: (c: any) => c.ClienteObservaciones || c.observaciones || '-' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (c: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700 dark:hover:text-primary-400 transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clientes</h1>
        <Button onClick={() => setShowModal(true)}><Plus size={16} className="mr-1" /> Nuevo Cliente</Button>
      </div>
      <Card><Table columns={columns} data={clientes} /></Card>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Cliente">
        <div className="space-y-4">
          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del cliente" />
          <Input label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={saving}>Crear</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Cliente">
        <div className="space-y-4">
          <Input label="Nombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre del cliente" />
          <Input label="Observaciones" value={editObservaciones} onChange={(e) => setEditObservaciones(e.target.value)} placeholder="Observaciones (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} loading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
