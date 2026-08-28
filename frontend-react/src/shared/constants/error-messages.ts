/**
 * Map API error codes to user-friendly Vietnamese messages
 * Source of truth: v1-docs/API_SPEC.md
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  AUTH_001: 'Email hoặc mật khẩu sai',
  AUTH_002: 'Token đã hết hạn, vui lòng đăng nhập lại',
  AUTH_003: 'Token không hợp lệ',
  AUTH_004: 'Bạn không có quyền thực hiện thao tác này',
  AUTH_005: 'Email đã tồn tại',
  AUTH_006: 'Tài khoản đã bị khoá',
  AUTH_007: 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại',

  // User
  USER_001: 'Người dùng không tồn tại',
  USER_002: 'Bạn không thể thay đổi vai trò của chính mình',
  USER_003: 'Bạn không thể vô hiệu hoá tài khoản của chính mình',
  USER_004: 'Mật khẩu cũ không chính xác',
  USER_005: 'Không thể xoá admin cuối cùng',

  // List
  LIST_001: 'Danh sách không tồn tại',
  LIST_002: 'Bạn không phải chủ sở hữu danh sách này',
  LIST_003: 'Tên danh sách đã tồn tại',

  // Task
  TASK_001: 'Công việc không tồn tại',
  TASK_002: 'Bạn không có quyền truy cập công việc này',
  TASK_003: 'Không thể chuyển sang trạng thái này',
  TASK_004: 'Công việc con không thể có công việc con',
  TASK_005: 'Còn công việc con chưa hoàn thành',
  TASK_006: 'Người được gán không tồn tại hoặc đã bị vô hiệu hoá',
  TASK_007: 'Tham chiếu công việc cha không hợp lệ (vòng lặp)',

  // Tag
  TAG_001: 'Nhãn không tồn tại',
  TAG_002: 'Tên nhãn đã tồn tại',

  // Comment
  CMT_001: 'Bình luận không tồn tại',
  CMT_002: 'Bạn không phải tác giả bình luận',

  // File
  FILE_001: 'Tệp không tồn tại',
  FILE_002: 'Tệp quá lớn (tối đa 10MB)',
  FILE_003: 'Loại tệp không được hỗ trợ',

  // Notification
  NOTIF_001: 'Thông báo không tồn tại',

  // System
  SYS_001: 'Có lỗi xảy ra, vui lòng thử lại',
  SYS_002: 'Dữ liệu không hợp lệ',
  SYS_003: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
};

export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SYS_001;
};
