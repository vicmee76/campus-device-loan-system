export interface DeviceInventoryTable {
  inventory_id: string; // UUID
  device_id: string; // UUID
  serial_number: string;
  is_available: boolean;
  created_at: Date;
}

