import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Repeat,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgIcon: string;
}

const features: Feature[] = [
  {
    icon: Wallet,
    title: 'Cajas múltiples',
    description: 'Manejá cajas en pesos y dólares con saldos en tiempo real.',
    color: 'text-blue-600 dark:text-blue-400',
    bgIcon: 'bg-blue-100 dark:bg-blue-900/40',
  },
  {
    icon: ArrowDownCircle,
    title: 'Control de ingresos',
    description: 'Registrá y categorizá todos tus ingresos de forma simple.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgIcon: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  {
    icon: ArrowUpCircle,
    title: 'Control de egresos',
    description: 'Seguí tus gastos por categoría y período.',
    color: 'text-red-600 dark:text-red-400',
    bgIcon: 'bg-red-100 dark:bg-red-900/40',
  },
  {
    icon: ArrowRightLeft,
    title: 'Transferencias',
    description: 'Mové dinero entre cajas de forma rápida y segura.',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgIcon: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
  {
    icon: Repeat,
    title: 'Gastos y cobros recurrentes',
    description: 'Automatizá tus cobros y gastos mensuales.',
    color: 'text-amber-600 dark:text-amber-400',
    bgIcon: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    icon: BarChart3,
    title: 'Informes',
    description: 'Visualizá resúmenes mensuales con gráficos claros.',
    color: 'text-purple-600 dark:text-purple-400',
    bgIcon: 'bg-purple-100 dark:bg-purple-900/40',
  },
];

export default function Landing() {
  const { token, tenantId } = useAuthStore();
  const { dark, toggle } = useThemeStore();

  // Redirect authenticated users
  if (token) {
    window.location.href = tenantId ? '/app' : '/select-account';
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={28} className="text-primary-600" />
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Wallet</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/login" className="hidden sm:block">
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Ingresar
              </button>
            </Link>
            <Link to="/register">
              <button className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                Registrate
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16">
        <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Tu dinero,<br />bajo control.
            </h1>
            <p className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto text-slate-300">
              Gestioná ingresos, egresos, cajas, transferencias y más.
              Simple, rápido y gratis.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <button className="w-full sm:w-auto rounded-lg text-lg px-8 py-3 font-semibold transition-colors shadow-lg bg-slate-100 text-gray-900 hover:bg-white">
                  Empezar ahora
                </button>
              </Link>
              <Link to="/login">
                <button className="w-full sm:w-auto rounded-lg border border-slate-500 text-slate-200 hover:bg-slate-700 text-lg px-8 py-3 font-medium transition-colors">
                  Ya tengo cuenta
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
            Todo lo que necesitás
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-14 max-w-xl mx-auto">
            Herramientas simples para tener visibilidad completa de tus finanzas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${f.bgIcon}`}>
                  <f.icon size={24} className={f.color} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 sm:py-24 text-white bg-gradient-to-br from-slate-800 via-gray-900 to-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            ¿Listo para tomar el control?
          </h2>
          <p className="text-lg mb-10 text-slate-300">
            Creá tu cuenta en segundos y empezá a gestionar tu dinero como nunca antes.
          </p>
          <Link to="/register">
            <button className="rounded-lg text-lg px-10 py-3 font-semibold transition-colors shadow-lg bg-slate-100 text-gray-900 hover:bg-white">
              Creá tu cuenta gratis
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-primary-500" />
            <span className="font-semibold text-gray-300">Wallet</span>
            <span className="text-sm">© {new Date().getFullYear()}</span>
          </div>
          <Link to="/login" className="text-sm hover:text-white transition-colors">
            Ingresar a mi cuenta
          </Link>
        </div>
      </footer>
    </div>
  );
}
