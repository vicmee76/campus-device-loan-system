export interface WaitlistTable {
  waitlist_id: string; // UUID
  user_id: string; // UUID
  device_id: string; // UUID
  added_at: Date;
  is_notified: boolean;
  notified_at: Date | null;
}

