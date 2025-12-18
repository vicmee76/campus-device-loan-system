import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('email_notifications', (table) => {
    table.boolean('is_read').defaultTo(false).notNullable();
    table.index('is_read');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('email_notifications', (table) => {
    table.dropIndex('is_read');
    table.dropColumn('is_read');
  });
}

