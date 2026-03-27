export interface DesignVariation {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  canvasData: Record<string, unknown>;
  thumbnailUrl: string | null;
  createdAt: Date;
}
