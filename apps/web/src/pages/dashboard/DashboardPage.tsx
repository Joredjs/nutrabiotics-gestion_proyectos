import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/axios';
import { TaskStatus } from '@nutrabiotics-system/shared-types';
import { TaskCard } from '../../components/tasks/TaskCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await api.get('/users/me/stats');
      return response.data.data;
    },
  });

  const { data: myTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks-dashboard'],
    queryFn: async () => {
      const response = await api.get('/tasks/my-tasks?limit=5&status=TODO,IN_PROGRESS');
      return response.data.data;
    },
  });

  if (statsLoading || tasksLoading) {
    return <LoadingSpinner />;
  }

  const taskStats = stats?.stats?.tasksByStatus || {};

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {user?.name}!
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Aquí está tu resumen del día
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proyectos Activos
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.stats?.totalAssignedProjects || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tareas Completadas
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats[TaskStatus.DONE] || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En Progreso
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats[TaskStatus.IN_PROGRESS] || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendientes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats[TaskStatus.TODO] || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Tareas Recientes
          </h3>
          {myTasks && myTasks.length > 0 ? (
            <div className="space-y-3">
              {myTasks.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No tienes tareas pendientes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
