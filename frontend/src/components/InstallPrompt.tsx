import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { usePwaInstall } from '../hooks/usePwaInstall';

/**
 * Banner que aparece en el Home invitando al usuario a instalar la PWA.
 *
 * - Android Chrome/Edge + Desktop Chrome/Edge: botón "Instalar app" que
 *   dispara el prompt nativo (BeforeInstallPrompt).
 * - iOS Safari: botón "Cómo instalar" que abre un modal con instrucciones
 *   paso a paso (Apple no soporta BeforeInstallPrompt).
 * - Ya instalado / dismissado / plataforma no soportada: no se renderiza.
 */
export default function InstallPrompt() {
  const { canInstall, hasNativePrompt, promptInstall, dismiss } =
    usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!canInstall) return null;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      setInstalling(true);
      const result = await promptInstall();
      setInstalling(false);
      // If the user dismissed the native prompt, also hide our banner —
      // they made an explicit choice not to install.
      if (result === 'dismissed') {
        dismiss();
      }
    } else {
      // iOS — show manual instructions.
      setShowIosModal(true);
    }
  };

  return (
    <>
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/50">
            <Download size={20} className="text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Instalá la app en tu dispositivo
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Accedé más rápido y recibí las notificaciones de recurrentes
              pendientes.
            </p>
            <div className="mt-3">
              <Button onClick={handleInstallClick} loading={installing}>
                <Download size={16} className="mr-1" />
                {hasNativePrompt ? 'Instalar app' : 'Cómo instalar'}
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Cerrar aviso de instalación"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <Modal
        open={showIosModal}
        onClose={() => setShowIosModal(false)}
        title="Instalá la app en tu iPhone o iPad"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            En iOS, instalás la app desde Safari con estos pasos:
          </p>
          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold dark:bg-blue-900/50 dark:text-blue-300">
                1
              </span>
              <div className="text-sm">
                Tocá el botón <strong>Compartir</strong> abajo en Safari:
                <div className="mt-1 inline-flex items-center gap-1">
                  <Share size={18} className="text-blue-500" />
                  <span className="text-gray-500">
                    (cuadrado con flecha hacia arriba)
                  </span>
                </div>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold dark:bg-blue-900/50 dark:text-blue-300">
                2
              </span>
              <div className="text-sm">
                Desplazate y tocá{' '}
                <strong>
                  «Agregar a inicio»
                </strong>{' '}
                <Plus size={14} className="inline" />
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold dark:bg-blue-900/50 dark:text-blue-300">
                3
              </span>
              <div className="text-sm">
                Confirmá tocando <strong>«Agregar»</strong> arriba a la derecha.
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold dark:bg-blue-900/50 dark:text-blue-300">
                4
              </span>
              <div className="text-sm">
                Abrí la app desde el{' '}
                <strong>nuevo ícono en tu pantalla de inicio</strong> (no desde
                Safari). Recién ahí vas a poder activar las notificaciones push.
              </div>
            </li>
          </ol>
          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={() => setShowIosModal(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
