import { NavLink } from 'react-router-dom';
import {
  Home, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, Repeat, Users, FileText, FileDown,
  ClipboardList, ClipboardCheck, BarChart3, Settings, LogOut, Wallet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/themeStore';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/ingresos', icon: ArrowDownCircle, label: 'Ingresos' },
  { to: '/egresos', icon: ArrowUpCircle, label: 'Egresos' },
  { to: '/transferencias', icon: ArrowRightLeft, label: 'Transferencias' },
  { to: '/movimientos-recurrentes', icon: Repeat, label: 'Recurrentes' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/facturas', icon: FileText, label: 'Facturas a Cobrar' },
  { to: '/facturas-gasto', icon: FileDown, label: 'Facturas a Pagar' },
  { to: '/planilla-gastos', icon: ClipboardList, label: 'Planilla Gastos' },
  { to: '/planilla-cobros', icon: ClipboardCheck, label: 'Planilla Cobros' },
  { to: '/informes', icon: BarChart3, label: 'Informes' },
  { to: '/configuracion', icon: Settings, label: 'Configuracion' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { tenantName, logout } = useAuth();
  const { dark, toggle } = useThemeStore();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <Wallet size={24} className="text-primary-600" />
          <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Wallet</span>
        </div>

        <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
          {tenantName || 'Cuenta'}
        </div>

        <nav className="p-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <Settings size={18} />
            {dark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
