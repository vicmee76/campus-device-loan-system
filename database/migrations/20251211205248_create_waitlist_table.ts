import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('waitlist', (table) => {
    table.uuid('waitlist_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('device_id').notNullable().references('device_id').inTable('devices').onDelete('CASCADE');
    table.timestamp('added_at').defaultTo(knex.fn.now()).notNullable();
    table.boolean('is_notified').defaultTo(false).notNullable();
    table.timestamp('notified_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('waitlist');
}

