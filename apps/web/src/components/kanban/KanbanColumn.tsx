import { useDroppable } from '@dnd-kit/core';
import { TaskStatus } from '@nutrabiotics-system/shared-types';
import { KanbanTaskCard } from './KanbanTaskCard';

interface KanbanColumnProps {
  column: {
    id: TaskStatus;
    title: string;
    color: string;
  };
  tasks: any[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full ${column.color}`}>
            {tasks.length}
          </span>
        </div>

        <div
          ref={setNodeRef}
          className={`space-y-3 min-h-[400px] ${isOver ? 'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg' : ''}`}
        >
          {tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
