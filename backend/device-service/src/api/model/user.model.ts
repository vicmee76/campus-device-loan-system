export interface UserTable {
  user_id: string; // UUID
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'staff';
  created_at: Date;
  is_active: boolean;
  is_deleted: boolean;
}

