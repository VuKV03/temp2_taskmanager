export const ERROR_CODES = {
  // Auth
  AUTH_001: { code: 'AUTH_001', message: 'Invalid credentials', status: 401 },
  AUTH_002: { code: 'AUTH_002', message: 'Token expired', status: 401 },
  AUTH_003: { code: 'AUTH_003', message: 'Token invalid', status: 401 },
  AUTH_004: { code: 'AUTH_004', message: 'Insufficient permissions', status: 403 },
  AUTH_005: { code: 'AUTH_005', message: 'Email already exists', status: 409 },
  AUTH_006: { code: 'AUTH_006', message: 'Account is locked', status: 403 },
  AUTH_007: { code: 'AUTH_007', message: 'Refresh token revoked', status: 401 },
  AUTH_008: { code: 'AUTH_008', message: 'Session not found', status: 404 },

  // User
  USER_001: { code: 'USER_001', message: 'User not found', status: 404 },
  USER_002: { code: 'USER_002', message: 'Cannot modify your own role', status: 400 },
  USER_003: { code: 'USER_003', message: 'Cannot deactivate your own account', status: 400 },
  USER_004: { code: 'USER_004', message: 'Old password incorrect', status: 400 },
  USER_005: { code: 'USER_005', message: 'Cannot delete the last admin', status: 400 },

  // List
  LIST_001: { code: 'LIST_001', message: 'List not found', status: 404 },
  LIST_002: { code: 'LIST_002', message: 'Not the list owner', status: 403 },
  LIST_003: { code: 'LIST_003', message: 'List name already exists', status: 409 },

  // Task
  TASK_001: { code: 'TASK_001', message: 'Task not found', status: 404 },
  TASK_002: { code: 'TASK_002', message: 'No access to this task', status: 403 },
  TASK_003: { code: 'TASK_003', message: 'Invalid status transition', status: 400 },
  TASK_004: { code: 'TASK_004', message: 'Subtask cannot have subtask (max depth 1)', status: 400 },
  TASK_005: { code: 'TASK_005', message: 'Cannot complete: subtasks unfinished', status: 400 },
  TASK_006: { code: 'TASK_006', message: 'Assignee is inactive or not found', status: 400 },
  TASK_007: { code: 'TASK_007', message: 'Circular parent reference', status: 400 },

  // Tag
  TAG_001: { code: 'TAG_001', message: 'Tag not found', status: 404 },
  TAG_002: { code: 'TAG_002', message: 'Tag name already exists', status: 409 },

  // Comment
  CMT_001: { code: 'CMT_001', message: 'Comment not found', status: 404 },
  CMT_002: { code: 'CMT_002', message: 'Not the comment author', status: 403 },

  // File
  FILE_001: { code: 'FILE_001', message: 'Attachment not found', status: 404 },
  FILE_002: { code: 'FILE_002', message: 'File too large', status: 400 },
  FILE_003: { code: 'FILE_003', message: 'Unsupported file type', status: 400 },

  // Notification
  NOTIF_001: { code: 'NOTIF_001', message: 'Notification not found', status: 404 },

  // System
  SYS_001: { code: 'SYS_001', message: 'Internal server error', status: 500 },
  SYS_002: { code: 'SYS_002', message: 'Validation error', status: 400 },
  SYS_003: { code: 'SYS_003', message: 'Too many requests', status: 429 },
};
