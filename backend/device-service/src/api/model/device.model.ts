export interface DeviceTable {
  device_id: string; // UUID
  brand: string;
  model: string;
  category: string; // laptop, tablet, camera, etc.
  description: string | null;
  image_url: string | null;
  default_loan_duration_days: number;
  created_at: Date;
  is_deleted: boolean;
}

