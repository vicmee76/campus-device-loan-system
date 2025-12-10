import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { UserTable } from '../model/user.model';
import { UserDto, CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import UserFactory from '../factory/user.factory';
import { hashPassword } from '../utils/password.utils';

@injectable()
export class UserRepository {

    private readonly tableName = 'users';


    async create(userData: CreateUserDto): Promise<UserDto> {
        const hashedPassword = await hashPassword(userData.Password);
        
        const [user] = await db(this.tableName)
            .insert({
                email: userData.Email,
                password: hashedPassword,
                first_name: userData.FirstName,
                last_name: userData.LastName,
                role: userData.Role,
                is_active: true,
                is_deleted: false,
            })
            .returning('*');

        return UserFactory.toDto(user as UserTable);
    }

   
    async findById(userId: string, includeDeleted: boolean = false): Promise<UserDto | null> {
        let query = db(this.tableName).where('user_id', userId);

        if (!includeDeleted)
            query = query.where('is_deleted', false);

        const user = await query.first();
        return user ? UserFactory.toDto(user as UserTable) : null;
    }

    async findByEmail(email: string, includeDeleted: boolean = false): Promise<UserDto | null> {
        let query = db(this.tableName).where('email', email);

        if (!includeDeleted)
            query = query.where('is_deleted', false);

        const user = await query.first();
        return user ? UserFactory.toDto(user as UserTable) : null;
    }

    async findAll(options: {
        role?: 'student' | 'staff';
        isActive?: boolean;
        includeDeleted?: boolean;
        limit?: number;
        offset?: number;
    } = {}): Promise<UserDto[]> {
        let query = db(this.tableName);

        if (options.role)
            query = query.where('role', options.role);

        if (options.isActive !== undefined)
            query = query.where('is_active', options.isActive);

        if (!options.includeDeleted)
            query = query.where('is_deleted', false);

        if (options.limit)
            query = query.limit(options.limit);

        if (options.offset)
            query = query.offset(options.offset);

        query = query.orderBy('created_at', 'desc');

        const users = await query;

        return UserFactory.toDtoArray(users as UserTable[]);
    }

  


    async update(userId: string, userData: UpdateUserDto): Promise<UserDto | null> {
        const updateData = UserFactory.toTable(userData);

        const [updatedUser] = await db(this.tableName)
            .where('user_id', userId)
            .where('is_deleted', false)
            .update(updateData)
            .returning('*');

        return updatedUser ? UserFactory.toDto(updatedUser as UserTable) : null;
    }

    async updatePassword(userId: string, password: string): Promise<boolean> {
        const hashedPassword = await hashPassword(password);
        
        const result = await db(this.tableName)
            .where('user_id', userId)
            .where('is_deleted', false)
            .update({ password: hashedPassword });

        return result > 0;
    }


    async softDelete(userId: string): Promise<boolean> {
        const result = await db(this.tableName)
            .where('user_id', userId)
            .where('is_deleted', false)
            .update({
                is_deleted: true,
                is_active: false,
            });

        return result > 0;
    }


    async hardDelete(userId: string): Promise<boolean> {
        const result = await db(this.tableName)
            .where('user_id', userId)
            .delete();

        return result > 0;
    }


    async activate(userId: string): Promise<boolean> {
        const result = await db(this.tableName)
            .where('user_id', userId)
            .where('is_deleted', false)
            .update({ is_active: true });

        return result > 0;
    }


    async deactivate(userId: string): Promise<boolean> {
        const result = await db(this.tableName)
            .where('user_id', userId)
            .where('is_deleted', false)
            .update({ is_active: false });

        return result > 0;
    }


    async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
        let query = db(this.tableName)
            .where('email', email)
            .where('is_deleted', false);

        if (excludeUserId)
            query = query.where('user_id', '!=', excludeUserId);

        const user = await query.first();

        return !!user;
    }


    async count(options: {
        role?: 'student' | 'staff';
        isActive?: boolean;
        includeDeleted?: boolean;
    } = {}): Promise<number> {
        let query = db(this.tableName);

        if (options.role)
            query = query.where('role', options.role);

        if (options.isActive !== undefined)
            query = query.where('is_active', options.isActive);

        if (!options.includeDeleted)
            query = query.where('is_deleted', false);

        const result = await query.count('* as count').first();

        return parseInt((result as { count: string }).count, 10);
    }
}

export default new UserRepository();

