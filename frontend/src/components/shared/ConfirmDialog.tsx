import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message, loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}
