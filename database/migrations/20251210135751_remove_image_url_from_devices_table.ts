import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if column exists before dropping it
  const hasColumn = await knex.schema.hasColumn('devices', 'image_url');
  if (hasColumn) {
    return knex.schema.table('devices', (table) => {
      table.dropColumn('image_url');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Check if column doesn't exist before adding it
  const hasColumn = await knex.schema.hasColumn('devices', 'image_url');
  if (!hasColumn) {
    return knex.schema.table('devices', (table) => {
      table.text('image_url').nullable();
    });
  }
}

