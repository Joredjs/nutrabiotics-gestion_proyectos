import { Calendar, Flag } from 'lucide-react';
import { Task, TaskStatus, Priority } from '@nutrabiotics-system/shared-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCardProps {
  task: Task & { project?: any };
}

const statusColors = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.REVIEW]: 'bg-yellow-100 text-yellow-800',
  [TaskStatus.DONE]: 'bg-green-100 text-green-800',
};

const priorityColors = {
  [Priority.LOW]: 'text-gray-400',
  [Priority.MEDIUM]: 'text-yellow-500',
  [Priority.HIGH]: 'text-red-500',
};

const statusLabels = {
  [TaskStatus.TODO]: 'Por hacer',
  [TaskStatus.IN_PROGRESS]: 'En progreso',
  [TaskStatus.REVIEW]: 'En revisión',
  [TaskStatus.DONE]: 'Completado',
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
        <Flag className={`h-4 w-4 ${priorityColors[task.priority]}`} />
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>

        {task.dueDate && (
          <div className="flex items-center text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
          </div>
        )}
      </div>

      {task.project && (
        <div className="mt-2 text-xs text-gray-500">
          {task.project.name}
        </div>
      )}
    </div>
  );
}
