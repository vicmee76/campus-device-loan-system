import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('user_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.enum('role', ['student', 'staff']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.boolean('is_deleted').defaultTo(false).notNullable();

    // Indexes
    table.index('email');
    table.index('role');
    table.index('is_active');
    table.index('is_deleted');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}

