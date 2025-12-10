import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { UserTable } from '../model/user.model';
import { UserDto, CreateUserDto, UpdateUserDto, PaginatedResult, PaginationMeta } from '../dtos/user.dto';
import UserFactory from '../factory/user.factory';
import { hashPassword } from '../utils/password.utils';

@injectable()
export class UserRepository {

    private readonly tableName = 'users';


    async create(userData: CreateUserDto): Promise<UserDto> {
        const hashedPassword = await hashPassword(userData.password);

        const [user] = await db(this.tableName)
            .insert({
                email: userData.email,
                password: hashedPassword,
                first_name: userData.firstName,
                last_name: userData.lastName,
                role: userData.role,
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

    async findByEmailWithPassword(email: string): Promise<UserTable | null> {
        const user = await db(this.tableName)
            .where('email', email)
            .where('is_deleted', false)
            .where('is_active', true)
            .first();

        return user ? (user as UserTable) : null;
    }

    async findAll(options: {
        role?: 'student' | 'staff';
        isActive?: boolean;
        includeDeleted?: boolean;
        firstName?: string;
        lastName?: string;
        email?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PaginatedResult<UserDto>> {
        let baseQuery = db(this.tableName);

        if (options.role)
            baseQuery = baseQuery.where('role', options.role);

        if (options.isActive !== undefined)
            baseQuery = baseQuery.where('is_active', options.isActive);

        if (!options.includeDeleted)
            baseQuery = baseQuery.where('is_deleted', false);

        if (options.firstName)
            baseQuery = baseQuery.whereILike('first_name', `%${options.firstName}%`);

        if (options.lastName)
            baseQuery = baseQuery.whereILike('last_name', `%${options.lastName}%`);

        if (options.email)
            baseQuery = baseQuery.whereILike('email', `%${options.email}%`);

        const totalCountResult = await baseQuery.clone().count('* as count').first();
        const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

        let dataQuery = baseQuery.clone().orderBy('created_at', 'desc');

        const page = options.page || 1;
        const pageSize = options.pageSize || 10;

        if (options.page && options.pageSize) {
            const offset = (page - 1) * pageSize;
            dataQuery = dataQuery.limit(pageSize).offset(offset);
        }

        const users = await dataQuery;
        const userDtos = UserFactory.toDtoArray(users as UserTable[]);

        const totalPages = Math.ceil(totalCount / pageSize);
        const pagination: PaginationMeta = {
            page,
            pageSize,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };

        return {
            pagination,
            data: userDtos,
        };
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

