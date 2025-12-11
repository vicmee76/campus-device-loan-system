import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('device_inventory', (table) => {
    table.uuid('inventory_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('device_id').notNullable().references('device_id').inTable('devices').onDelete('CASCADE');
    table.string('serial_number', 255).notNullable();
    table.boolean('is_available').defaultTo(true).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    // Indexes
    table.index('device_id');
    table.index('serial_number');
    table.unique(['device_id', 'serial_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('device_inventory');
}

