import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import SelectAccount from './pages/SelectAccount';
import Home from './pages/Home';
import CajaDetalle from './pages/CajaDetalle';
import Ingresos from './pages/Ingresos';
import Egresos from './pages/Egresos';
import Clientes from './pages/Clientes';
import Facturas from './pages/Facturas';
import FacturasGasto from './pages/FacturasGasto';
import Transferencias from './pages/Transferencias';
import PlanillaGastos from './pages/PlanillaGastos';
import PlanillaCobros from './pages/PlanillaCobros';
import MovimientosRecurrentes from './pages/MovimientosRecurrentes';
import Informes from './pages/Informes';
import Configuracion from './pages/Configuracion';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, tenantId } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!tenantId) return <Navigate to="/select-account" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/select-account" element={<SelectAccount />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="cajas/:id" element={<CajaDetalle />} />
        <Route path="ingresos" element={<Ingresos />} />
        <Route path="egresos" element={<Egresos />} />
        <Route path="transferencias" element={<Transferencias />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="facturas-gasto" element={<FacturasGasto />} />
        <Route path="planilla-gastos" element={<PlanillaGastos />} />
        <Route path="planilla-cobros" element={<PlanillaCobros />} />
        <Route path="movimientos-recurrentes" element={<MovimientosRecurrentes />} />
        <Route path="informes" element={<Informes />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  );
}
