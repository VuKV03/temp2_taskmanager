export interface UserSummary {
  id: number;
  fullName: string;
}

export interface Comment {
  id: number;
  taskId: number;
  content: string;
  user: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: number;
  taskId: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: UserSummary;
  createdAt: string;
}
