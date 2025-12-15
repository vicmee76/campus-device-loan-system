import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loans', (table) => {
    table.uuid('loan_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('reservation_id').notNullable().references('reservation_id').inTable('reservations').onDelete('CASCADE');
    table.timestamp('collected_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('returned_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loans');
}

