export const REPOSITORY_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  AUTH_REPOSITORY: 'IAuthRepository',
  PROJECT_REPOSITORY: 'IProjectRepository',
  TASK_REPOSITORY: 'ITaskRepository',
} as const;

// Exportamos como tipos para type safety
export type RepositoryToken = typeof REPOSITORY_TOKENS[keyof typeof REPOSITORY_TOKENS];
