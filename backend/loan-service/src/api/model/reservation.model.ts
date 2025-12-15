export interface Reservation {
  ReservationId: string;
  UserId: string;
  DeviceId: string;
  InventoryId: string;
  ReservedAt: Date;
  DueDate: Date;
  Status: "pending" | "collected" | "returned" | "cancelled";
}

export interface ReservationTable {
  reservation_id: string;
  user_id: string;
  device_id: string;
  inventory_id: string;
  reserved_at: Date;
  due_date: Date;
  status: "pending" | "collected" | "returned" | "cancelled";
}

