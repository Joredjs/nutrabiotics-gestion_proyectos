import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Priority, Task } from '@nutrabiotics-system/shared-types';

const taskSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.nativeEnum(Priority),
  projectId: z.string().min(1, 'Debes seleccionar un proyecto'),
  assignedToId: z.string().optional(),
  estimatedHours: z.number().min(0.5).max(999).optional(),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  task?: Task;
  projectId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskFormModal({ task, projectId, onClose, onSuccess }: TaskFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      projectId: projectId || '',
    },
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.data;
    },
  });

  // Fetch developers
  const { data: developers } = useQuery({
    queryKey: ['developers-list'],
    queryFn: async () => {
      const response = await api.get('/users/developers');
      return response.data.data;
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (task) {
        return api.patch(`/tasks/${task.id}`, data);
      }
      return api.post(`/projects/${data.projectId}/tasks`, data);
    },
    onSuccess: () => {
      toast.success(task ? 'Tarea actualizada' : 'Tarea creada');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar la tarea');
    },
  });

  // Load task data if editing
  useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('description', task.description);
      setValue('priority', task.priority);
      setValue('projectId', task.projectId);
      setValue('assignedToId', task.assignedToId || '');
      setValue('estimatedHours', task.estimatedHours || undefined);
      if (task.dueDate) {
        setValue('dueDate', new Date(task.dueDate).toISOString().split('T')[0]);
      }
    }
  }, [task, setValue]);

  const onSubmit = (data: TaskFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg max-w-lg w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                {...register('title')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                <select
                  {...register('projectId')}
                  disabled={!!projectId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <select
                  {...register('priority')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value={Priority.LOW}>Baja</option>
                  <option value={Priority.MEDIUM}>Media</option>
                  <option value={Priority.HIGH}>Alta</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Asignar a</label>
                <select
                  {...register('assignedToId')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Sin asignar</option>
                  {developers?.map((dev: any) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Horas estimadas</label>
                <input
                  {...register('estimatedHours', { valueAsNumber: true })}
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="999"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha límite</label>
              <input
                {...register('dueDate')}
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
