import { db } from '../../database/connection';
import { UserTable } from '../model/user.model';

export class UserRepository {
  private readonly tableName = 'users';

  async findById(userId: string, includeDeleted: boolean = false): Promise<UserTable | null> {
    let query = db(this.tableName).where('user_id', userId);

    if (!includeDeleted) {
      query = query.where('is_deleted', false);
    }

    return query.first() as Promise<UserTable | null>;
  }

  async findByEmail(email: string): Promise<UserTable | null> {
    return db(this.tableName)
      .where('email', email)
      .where('is_deleted', false)
      .where('is_active', true)
      .first() as Promise<UserTable | null>;
  }
}

export default new UserRepository();

