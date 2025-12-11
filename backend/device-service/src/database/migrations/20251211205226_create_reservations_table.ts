import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reservations', (table) => {
    table.uuid('reservation_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('device_id').notNullable().references('device_id').inTable('devices').onDelete('CASCADE');
    table.uuid('inventory_id').notNullable().references('inventory_id').inTable('device_inventory').onDelete('CASCADE');
    table.timestamp('reserved_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('due_date').notNullable();
    table.string('status', 50).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('reservations');
}

