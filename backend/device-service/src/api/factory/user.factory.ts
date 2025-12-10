import { UserTable } from '../model/user.model';
import { UserDto, CreateUserDto } from '../dtos/user.dto';

export class UserFactory {
    


    static toDto(userTable: UserTable): UserDto {
        return {
            userId: userTable.user_id,
            email: userTable.email,
            firstName: userTable.first_name,
            lastName: userTable.last_name,
            role: userTable.role,
            createdAt: userTable.created_at,
            isActive: userTable.is_active,
            isDeleted: userTable.is_deleted,
        };
    }




    static toDtoArray(userTables: UserTable[]): UserDto[] {
        return userTables.map((userTable) => this.toDto(userTable));
    }




    static toTable(userDto: Partial<UserDto & { password?: string }>): Partial<UserTable> {
        const table: Partial<UserTable> = {};

        if (userDto.userId !== undefined) table.user_id = userDto.userId;
        if (userDto.email !== undefined) table.email = userDto.email;
        if ((userDto as any).password !== undefined) table.password = (userDto as any).password;
        if (userDto.firstName !== undefined) table.first_name = userDto.firstName;
        if (userDto.lastName !== undefined) table.last_name = userDto.lastName;
        if (userDto.role !== undefined) table.role = userDto.role;
        if (userDto.createdAt !== undefined) table.created_at = userDto.createdAt;
        if (userDto.isActive !== undefined) table.is_active = userDto.isActive;
        if (userDto.isDeleted !== undefined) table.is_deleted = userDto.isDeleted;

        return table;
    }


    static createDto(data: CreateUserDto & { userId?: string; createdAt?: Date }): UserDto {
        return {
            userId: data.userId || '',
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            createdAt: data.createdAt || new Date(),
            isActive: true,
            isDeleted: false,
        };
    }
}

export default UserFactory;

