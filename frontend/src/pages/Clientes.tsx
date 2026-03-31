import { useEffect, useState } from 'react';
import { clientesApi } from '../api/clientes';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    try {
      const { data } = await clientesApi.getAll();
      setClientes((data as any).data || data);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await clientesApi.create({ nombre, observaciones });
      toast.success('Cliente creado');
      setShowModal(false);
      setNombre('');
      setObservaciones('');
      loadClientes();
    } catch (err: any) {
      toast.error('Error al crear cliente');
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre', render: (c: any) => c.ClienteNombre || c.nombre },
    { key: 'observaciones', header: 'Observaciones', render: (c: any) => c.ClienteObservaciones || c.observaciones || '-' },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clientes</h1>
        <Button onClick={() => setShowModal(true)}><Plus size={16} className="mr-1" /> Nuevo Cliente</Button>
      </div>
      <Card><Table columns={columns} data={clientes} /></Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Cliente">
        <div className="space-y-4">
          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del cliente" />
          <Input label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones (opcional)" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
