import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileMenu } from './MobileMenu';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/projects') return 'Proyectos';
    if (path.startsWith('/projects/')) return 'Detalle del Proyecto';
    if (path === '/tasks') return 'Mis Tareas';
    if (path === '/kanban') return 'Tablero Kanban';
    if (path === '/users') return 'Usuarios';
    if (path === '/profile') return 'Mi Perfil';
    return 'Nutrabiotics System';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile menu */}
      <MobileMenu open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={getPageTitle()}
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
