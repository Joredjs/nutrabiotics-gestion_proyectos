import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  KanbanSquare,
  Users,
  User
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '@nutrabiotics-system/shared-types';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: 'all' },
  { name: 'Proyectos', href: '/projects', icon: FolderOpen, roles: 'all' },
  { name: 'Mis Tareas', href: '/tasks', icon: CheckSquare, roles: 'all' },
  { name: 'Tablero Kanban', href: '/kanban', icon: KanbanSquare, roles: 'all' },
  { name: 'Usuarios', href: '/users', icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: 'Mi Perfil', href: '/profile', icon: User, roles: 'all' },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);

  const isNavItemVisible = (roles: string | UserRole[]) => {
    if (roles === 'all') return true;
    if (!user) return false;
    return (roles as UserRole[]).includes(user.role);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
        <h1 className="text-white text-xl font-semibold">Nutrabiotics</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            if (!isNavItemVisible(item.roles)) return null;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
