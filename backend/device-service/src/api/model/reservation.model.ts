export interface ReservationTable {
  reservation_id: string; // UUID
  user_id: string; // UUID
  device_id: string; // UUID
  inventory_id: string; // UUID
  reserved_at: Date;
  due_date: Date;
  status: string;
}

