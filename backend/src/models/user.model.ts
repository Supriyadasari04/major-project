export interface UserDB {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar?: string;
  created_at: string;
}
