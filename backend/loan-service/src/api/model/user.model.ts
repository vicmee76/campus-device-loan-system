export interface UserTable {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'staff';
  is_active: boolean;
  is_deleted: boolean;
}

