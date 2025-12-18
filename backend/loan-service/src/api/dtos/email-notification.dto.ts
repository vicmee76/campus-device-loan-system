export interface EmailNotificationDto {
  emailId: string; // UUID
  userId: string; // UUID
  emailAddress: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  errorMessage: string | null;
  sentAt: Date | null;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateEmailNotificationDto {
  userId: string;
  emailAddress: string;
  subject: string;
  body: string;
}

