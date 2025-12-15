import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { UserTable } from '../model/user.model';
import { UserDto, PaginatedResult, PaginationMeta } from '../dtos/user.dto';
import UserFactory from '../factory/user.factory';

@injectable()
export class UserRepository {
    private readonly tableName = 'users';

    async findById(userId: string, includeDeleted: boolean = false): Promise<UserDto | null> {
        let query = db(this.tableName).where('user_id', userId);

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
}

export default new UserRepository();

