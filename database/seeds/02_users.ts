import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('users').del();

    // Hash password for all users (using a common password for seed data)
    const defaultPassword = await hashPassword('Password123!');

    // Inserts seed entries
    await knex('users').insert([
        // Staff members
        {
            email: 'john.smith@campus.edu',
            password: defaultPassword,
            first_name: 'John',
            last_name: 'Smith',
            role: 'staff',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'sarah.johnson@campus.edu',
            password: defaultPassword,
            first_name: 'Sarah',
            last_name: 'Johnson',
            role: 'staff',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'michael.brown@campus.edu',
            password: defaultPassword,
            first_name: 'Michael',
            last_name: 'Brown',
            role: 'staff',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'emily.davis@campus.edu',
            password: defaultPassword,
            first_name: 'Emily',
            last_name: 'Davis',
            role: 'staff',
            is_active: true,
            is_deleted: false,
        },

        // Students
        {
            email: 'alice.williams@student.campus.edu',
            password: defaultPassword,
            first_name: 'Alice',
            last_name: 'Williams',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'bob.miller@student.campus.edu',
            password: defaultPassword,
            first_name: 'Bob',
            last_name: 'Miller',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'charlie.wilson@student.campus.edu',
            password: defaultPassword,
            first_name: 'Charlie',
            last_name: 'Wilson',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'diana.moore@student.campus.edu',
            password: defaultPassword,
            first_name: 'Diana',
            last_name: 'Moore',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'edward.taylor@student.campus.edu',
            password: defaultPassword,
            first_name: 'Edward',
            last_name: 'Taylor',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'fiona.anderson@student.campus.edu',
            password: defaultPassword,
            first_name: 'Fiona',
            last_name: 'Anderson',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'george.thomas@student.campus.edu',
            password: defaultPassword,
            first_name: 'George',
            last_name: 'Thomas',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
        {
            email: 'hannah.jackson@student.campus.edu',
            password: defaultPassword,
            first_name: 'Hannah',
            last_name: 'Jackson',
            role: 'student',
            is_active: true,
            is_deleted: false,
        },
    ]);
}

