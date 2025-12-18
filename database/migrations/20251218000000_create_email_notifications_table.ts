import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('email_notifications', (table) => {
    table.uuid('email_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('email_address', 255).notNullable();
    table.string('subject', 500).notNullable();
    table.text('body').notNullable();
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending').notNullable();
    table.integer('attempts').defaultTo(0).notNullable();
    table.text('error_message').nullable();
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes for performance
    table.index('user_id');
    table.index('status');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('email_notifications');
}

