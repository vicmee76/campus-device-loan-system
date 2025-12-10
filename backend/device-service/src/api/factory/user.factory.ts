import { UserTable } from '../model/user.model';
import { UserDto, CreateUserDto } from '../dtos/user.dto';

export class UserFactory {
    


    static toDto(userTable: UserTable): UserDto {
        return {
            UserId: userTable.user_id,
            Email: userTable.email,
            FirstName: userTable.first_name,
            LastName: userTable.last_name,
            Role: userTable.role,
            CreatedAt: userTable.created_at,
            IsActive: userTable.is_active,
            IsDeleted: userTable.is_deleted,
        };
    }




    static toDtoArray(userTables: UserTable[]): UserDto[] {
        return userTables.map((userTable) => this.toDto(userTable));
    }




    static toTable(userDto: Partial<UserDto & { Password?: string }>): Partial<UserTable> {
        const table: Partial<UserTable> = {};

        if (userDto.UserId !== undefined) table.user_id = userDto.UserId;
        if (userDto.Email !== undefined) table.email = userDto.Email;
        if ((userDto as any).Password !== undefined) table.password = (userDto as any).Password;
        if (userDto.FirstName !== undefined) table.first_name = userDto.FirstName;
        if (userDto.LastName !== undefined) table.last_name = userDto.LastName;
        if (userDto.Role !== undefined) table.role = userDto.Role;
        if (userDto.CreatedAt !== undefined) table.created_at = userDto.CreatedAt;
        if (userDto.IsActive !== undefined) table.is_active = userDto.IsActive;
        if (userDto.IsDeleted !== undefined) table.is_deleted = userDto.IsDeleted;

        return table;
    }


    static createDto(data: CreateUserDto & { UserId?: string; CreatedAt?: Date }): UserDto {
        return {
            UserId: data.UserId || '',
            Email: data.Email,
            FirstName: data.FirstName,
            LastName: data.LastName,
            Role: data.Role,
            CreatedAt: data.CreatedAt || new Date(),
            IsActive: true,
            IsDeleted: false,
        };
    }
}

export default UserFactory;

