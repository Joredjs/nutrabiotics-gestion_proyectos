import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag, User } from 'lucide-react';
import { Task, Priority } from '@nutrabiotics-system/shared-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanTaskCardProps {
  task: Task & { project?: any; assignedTo?: any };
}

const priorityColors = {
  [Priority.LOW]: 'text-gray-400',
  [Priority.MEDIUM]: 'text-yellow-500',
  [Priority.HIGH]: 'text-red-500',
};

export function KanbanTaskCard({ task }: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
        <Flag className={`h-4 w-4 ${priorityColors[task.priority]}`} />
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      <div className="space-y-2">
        {task.project && (
          <div className="text-xs text-gray-500 font-medium">
            {task.project.name}
          </div>
        )}

        <div className="flex items-center justify-between">
          {task.assignedTo && (
            <div className="flex items-center text-xs text-gray-500">
              <User className="h-3 w-3 mr-1" />
              {task.assignedTo.name}
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
