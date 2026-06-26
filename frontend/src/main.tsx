import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Register the service worker (injectManifest). autoUpdate keeps the SW
// current; prompts refresh when a new version is available.
registerSW({
  onNeedRefresh() {
    // A new SW version is waiting; reload to activate.
    if (confirm('Hay una nueva versión disponible. ¿Recargar?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    // App is ready to work offline.
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
