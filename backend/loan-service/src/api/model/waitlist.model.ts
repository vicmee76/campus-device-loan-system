export interface Waitlist {
  WaitlistId: string;
  UserId: string;
  DeviceId: string;
  AddedAt: Date;
  IsNotified: boolean;
  NotifiedAt?: Date | null;
}

export interface WaitlistTable {
  waitlist_id: string;
  user_id: string;
  device_id: string;
  added_at: Date;
  is_notified: boolean;
  notified_at?: Date | null;
}

