// types para WebSocket y notificaciones

import { BaseEntity } from './base.types';

export enum WebSocketEvent {
  // Connection
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_PROJECT = 'join_project',
  LEAVE_PROJECT = 'leave_project',

  // Tasks
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_STATUS_CHANGED = 'task_status_changed',

  // Projects
  PROJECT_UPDATED = 'project_updated',
  PROJECT_USER_ASSIGNED = 'project_user_assigned',

  // Notifications
  NOTIFICATION = 'notification',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
}

export interface WebSocketNotification extends BaseEntity {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId: string;
  data?: any;
  read?: boolean;
}
