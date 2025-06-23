import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { api } from '../../lib/axios';
import { ProjectStatus, Priority, UserRole } from '@nutrabiotics-system/shared-types';
import { useAuthStore } from '../../stores/auth.store';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { ProjectFormModal } from '../../components/projects/ProjectFormModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function ProjectsPage() {
  const user = useAuthStore((state) => state.user);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', searchTerm, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await api.get(`/projects?${params.toString()}`);
      return response.data;
    },
  });

  const canCreateProject = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Proyectos</h1>
        {canCreateProject && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Todos los estados</option>
            <option value={ProjectStatus.PLANNING}>Planificación</option>
            <option value={ProjectStatus.IN_PROGRESS}>En Progreso</option>
            <option value={ProjectStatus.COMPLETED}>Completado</option>
            <option value={ProjectStatus.CANCELLED}>Cancelado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Todas las prioridades</option>
            <option value={Priority.LOW}>Baja</option>
            <option value={Priority.MEDIUM}>Media</option>
            <option value={Priority.HIGH}>Alta</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPriorityFilter('');
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="mr-2 h-4 w-4" />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron proyectos</p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <ProjectFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
