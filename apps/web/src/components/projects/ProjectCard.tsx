import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckSquare, AlertCircle } from 'lucide-react';
import { Project, ProjectStatus, Priority } from '@nutrabiotics-system/shared-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project & { _count?: { tasks: number } };
}

const statusColors = {
  [ProjectStatus.PLANNING]: 'bg-gray-100 text-gray-800',
  [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const priorityColors = {
  [Priority.LOW]: 'border-gray-200',
  [Priority.MEDIUM]: 'border-yellow-200',
  [Priority.HIGH]: 'border-red-200',
};

const statusLabels = {
  [ProjectStatus.PLANNING]: 'Planificación',
  [ProjectStatus.IN_PROGRESS]: 'En Progreso',
  [ProjectStatus.COMPLETED]: 'Completado',
  [ProjectStatus.CANCELLED]: 'Cancelado',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className={`bg-white p-6 rounded-lg shadow border-2 ${priorityColors[project.priority]} hover:shadow-lg transition-shadow cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {format(new Date(project.startDate), 'dd MMM yyyy', { locale: es })}
            {project.endDate && ` - ${format(new Date(project.endDate), 'dd MMM yyyy', { locale: es })}`}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-2" />
          <span>{project.developers?.length || 0} desarrolladores</span>
        </div>

        {project._count && (
          <div className="flex items-center text-sm text-gray-500">
            <CheckSquare className="h-4 w-4 mr-2" />
            <span>{project._count.tasks} tareas</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {project.manager?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="ml-2">
              <p className="text-xs text-gray-500">Manager</p>
              <p className="text-sm font-medium text-gray-900">{project.manager?.name}</p>
            </div>
          </div>

          {project.priority === Priority.HIGH && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
}
