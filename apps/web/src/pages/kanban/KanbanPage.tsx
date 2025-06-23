import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { api } from '../../lib/axios';
import { TaskStatus } from '@nutrabiotics-system/shared-types';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const columns = [
  { id: TaskStatus.TODO, title: 'Por Hacer', color: 'bg-gray-500' },
  { id: TaskStatus.IN_PROGRESS, title: 'En Progreso', color: 'bg-blue-500' },
  { id: TaskStatus.REVIEW, title: 'En Revisión', color: 'bg-yellow-500' },
  { id: TaskStatus.DONE, title: 'Completado', color: 'bg-green-500' },
];

export function KanbanPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Fetch projects for filter
  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.data;
    },
  });

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['kanban-tasks', selectedProjectId],
    queryFn: async () => {
      const params = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const response = await api.get(`/tasks${params}`);
      return response.data.data;
    },
  });

  // Update task status mutation
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    updateTaskStatus.mutate({ taskId, status: newStatus });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Group tasks by status
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasksData?.filter((task: any) => task.status === column.id) || [];
    return acc;
  }, {} as Record<TaskStatus, any[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Tablero Kanban</h1>
          {projects && projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los proyectos</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Kanban Board */}
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex-1 flex space-x-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id]}
            />
          ))}
        </div>
      </DndContext>

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskFormModal
          projectId={selectedProjectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
          }}
        />
      )}
    </div>
  );
}
