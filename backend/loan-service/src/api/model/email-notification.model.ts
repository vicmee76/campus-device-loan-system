export interface EmailNotificationTable {
  email_id: string; // UUID
  user_id: string; // UUID
  email_address: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  error_message: string | null;
  sent_at: Date | null;
  is_read: boolean;
  created_at: Date;
}

