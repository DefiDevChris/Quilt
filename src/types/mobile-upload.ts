export type MobileUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type MobileUploadAssignedType = 'unassigned' | 'fabric' | 'block' | 'quilt';

export interface MobileUpload {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  originalFilename: string | null;
  fileSizeBytes: number | null;
  status: MobileUploadStatus;
  assignedType: MobileUploadAssignedType;
  processedEntityId: string | null;
  processedEntityType: string | null;
  createdAt: string;
  updatedAt: string;
}
