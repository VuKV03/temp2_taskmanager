/**
 * Event payloads emitted by `task`/`collaboration` and consumed by
 * `notification`'s `NotificationEventsListener` — this is the only contract
 * between those modules; neither imports the other (CONTEXT.md: "Sent via
 * events (async, loss is acceptable)"), using the global `EventEmitterModule`
 * already registered in `app.module.ts`.
 */
export interface TaskAssignedEvent {
  userId: number;
  taskId: number;
  taskTitle: string;
}

export interface TaskCommentedEvent {
  recipientIds: number[];
  taskId: number;
  taskTitle: string;
  commenterName: string;
}
