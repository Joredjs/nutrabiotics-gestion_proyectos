import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Users,
  Flag,
  Plus,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/axios';
import { UserRole, Priority } from '@nutrabiotics-system/shared-types';
import { useAuthStore } from '../../stores/auth.store';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TaskCard } from '../../components/tasks/TaskCard';
import { ProjectFormModal } from '../../components/projects/ProjectFormModal';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const priorityColors = {
  [Priority.LOW]: 'text-gray-500 bg-gray-100',
  [Priority.MEDIUM]: 'text-yellow-600 bg-yellow-100',
  [Priority.HIGH]: 'text-red-600 bg-red-100',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/stats`);
      return response.data.data;
    },
    enabled: !!project,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      toast.success('Proyecto eliminado');
      navigate('/projects');
    },
    onError: () => {
      toast.error('Error al eliminar el proyecto');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return <div>Proyecto no encontrado</div>;
  }

  const canEdit = user?.role === UserRole.ADMIN || project.managerId === user?.id;
  const canDelete = user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/projects')}
                className="text-gray-400 hover:text-gray-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canEdit && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="p-2 text-red-400 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(project.startDate), 'dd MMM yyyy', { locale: es })}
              {project.endDate && ` - ${format(new Date(project.endDate), 'dd MMM yyyy', { locale: es })}`}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2" />
              {project.developers?.length || 0} desarrolladores
            </div>
            <div className="flex items-center">
              <Flag className="h-4 w-4 mr-2" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[project.priority as Priority]}`}>
                Prioridad {project.priority.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tareas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats.totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Desarrolladores</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats.totalDevelopers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Horas Estimadas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats.totalEstimatedHours}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Flag className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completado</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Equipo</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {project.manager?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{project.manager?.name}</p>
              <p className="text-sm text-gray-500">Manager</p>
            </div>
          </div>

          {project.developers?.map((developer: any) => (
            <div key={developer.id} className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {developer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{developer.name}</p>
                <p className="text-sm text-gray-500">Desarrollador</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Tareas</h2>
          <button
            onClick={() => setShowTaskModal(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-1 h-4 w-4" />
            Nueva Tarea
          </button>
        </div>

        {project.tasks && project.tasks.length > 0 ? (
          <div className="space-y-3">
            {project.tasks.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No hay tareas en este proyecto</p>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <ProjectFormModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ['project', id] });
          }}
        />
      )}

      {showTaskModal && (
        <TaskFormModal
          projectId={project.id}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            setShowTaskModal(false);
            queryClient.invalidateQueries({ queryKey: ['project', id] });
          }}
        />
      )}
    </div>
  );
}
