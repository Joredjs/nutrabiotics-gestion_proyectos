import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Priority, Project, UserRole } from '@nutrabiotics-system/shared-types';

const projectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.nativeEnum(Priority),
  startDate: z.string(),
  endDate: z.string().optional(),
  managerId: z.string().min(1, 'Debes seleccionar un manager'),
  developerIds: z.array(z.string()),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  project?: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectFormModal({ project, onClose, onSuccess }: ProjectFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      developerIds: [],
    },
  });

  // Fetch managers
  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const response = await api.get(`/users?role=${UserRole.MANAGER}`);
      return response.data.data;
    },
  });

  // Fetch developers
  const { data: developers } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const response = await api.get('/users/developers');
      return response.data.data;
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (project) {
        return api.patch(`/projects/${project.id}`, data);
      }
      return api.post('/projects', data);
    },
    onSuccess: () => {
      toast.success(project ? 'Proyecto actualizado' : 'Proyecto creado');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar el proyecto');
    },
  });

  // Load project data if editing
  useEffect(() => {
    if (project) {
      setValue('name', project.name);
      setValue('description', project.description);
      setValue('priority', project.priority);
      setValue('startDate', new Date(project.startDate).toISOString().split('T')[0]);
      if (project.endDate) {
        setValue('endDate', new Date(project.endDate).toISOString().split('T')[0]);
      }
      setValue('managerId', project.managerId);
      setValue('developerIds', project.developers?.map(d => d.id) || []);
    }
  }, [project, setValue]);

  const onSubmit = (data: ProjectFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg max-w-2xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
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
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Manager</label>
                <select
                  {...register('managerId')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar manager</option>
                  {managers?.map((manager: any) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                {errors.managerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.managerId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de fin (opcional)</label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desarrolladores</label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {developers?.map((dev: any) => (
                  <label key={dev.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={dev.id}
                      onChange={(e) => {
                        const currentIds = watch('developerIds');
                        if (e.target.checked) {
                          setValue('developerIds', [...currentIds, dev.id]);
                        } else {
                          setValue('developerIds', currentIds.filter(id => id !== dev.id));
                        }
                      }}
                      checked={watch('developerIds').includes(dev.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{dev.name}</span>
                  </label>
                ))}
              </div>
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
