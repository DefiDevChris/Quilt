export interface UserTemplate {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string | null;
  canvas_json: string | null;
  width_in: number | null;
  height_in: number | null;
  fabric_ids: string[];
  created_at: string;
  updated_at: string;
}
