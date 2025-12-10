import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('devices', (table) => {
    table.uuid('device_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('brand', 255).notNullable();
    table.string('model', 255).notNullable();
    table.string('category', 100).notNullable();
    table.text('description').nullable();
    table.integer('default_loan_duration_days').notNullable().defaultTo(2);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.boolean('is_deleted').defaultTo(false).notNullable();

    // Indexes
    table.index('brand');
    table.index('model');
    table.index('category');
    table.index('is_deleted');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('devices');
}

