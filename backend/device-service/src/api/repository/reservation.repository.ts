import { injectable } from 'tsyringe';
import { Knex } from 'knex';
import db from '../../database/connection';
import { ReservationTable } from '../model/reservation.model';
import { ReservationDto } from '../dtos/reservation.dto';
import ReservationFactory from '../factory/reservation.factory';

@injectable()
export class ReservationRepository {
  private readonly tableName = 'reservations';

  async createReservation(
    trx: Knex.Transaction,
    userId: string,
    deviceId: string,
    inventoryId: string,
    dueDate: Date
  ): Promise<ReservationDto> {
    const [reservation] = await trx(this.tableName)
      .insert({
        user_id: userId,
        device_id: deviceId,
        inventory_id: inventoryId,
        reserved_at: trx.fn.now(),
        due_date: dueDate,
        status: 'pending',
      })
      .returning('*');

    return ReservationFactory.toDto(reservation as ReservationTable);
  }

  async lockAndGetAvailableInventory(trx: Knex.Transaction, deviceId: string): Promise<string | null> {
    const result = await trx('device_inventory')
      .where('device_id', deviceId)
      .where('is_available', true)
      .forUpdate()
      .skipLocked()
      .select('inventory_id')
      .first();

    return result ? result.inventory_id : null;
  }

  async markInventoryAsUnavailable(trx: Knex.Transaction, inventoryId: string): Promise<void> {
    await trx('device_inventory')
      .where('inventory_id', inventoryId)
      .update({ is_available: false });
  }

  async findAll(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    let baseQuery = db(this.tableName)
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false);

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    let dataQuery = baseQuery
      .select(
        'reservations.reservation_id',
        'reservations.user_id',
        'reservations.device_id',
        'reservations.inventory_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
        'users.user_id as user_user_id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'users.created_at as user_created_at',
        'users.is_active',
        'users.is_deleted as user_is_deleted',
        'devices.device_id as device_device_id',
        'devices.brand',
        'devices.model',
        'devices.category',
        'devices.description',
        'devices.default_loan_duration_days',
        'devices.created_at as device_created_at',
        'devices.is_deleted',
        'device_inventory.inventory_id as inventory_inventory_id',
        'device_inventory.device_id as inventory_device_id',
        'device_inventory.serial_number',
        'device_inventory.is_available',
        'device_inventory.created_at as inventory_created_at'
      )
      .orderBy('reservations.reserved_at', 'desc');

    if (options.page && options.pageSize) {
      const offset = (page - 1) * pageSize;
      dataQuery = dataQuery.limit(pageSize).offset(offset);
    }

    const results = await dataQuery;
    return results;
  }

  async findByUserId(userId: string): Promise<any[]> {
    const results = await db(this.tableName)
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('reservations.user_id', userId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'reservations.reservation_id',
        'reservations.user_id',
        'reservations.device_id',
        'reservations.inventory_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
        'users.user_id as user_user_id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'users.created_at as user_created_at',
        'users.is_active',
        'users.is_deleted as user_is_deleted',
        'devices.device_id as device_device_id',
        'devices.brand',
        'devices.model',
        'devices.category',
        'devices.description',
        'devices.default_loan_duration_days',
        'devices.created_at as device_created_at',
        'devices.is_deleted',
        'device_inventory.inventory_id as inventory_inventory_id',
        'device_inventory.device_id as inventory_device_id',
        'device_inventory.serial_number',
        'device_inventory.is_available',
        'device_inventory.created_at as inventory_created_at'
      )
      .orderBy('reservations.reserved_at', 'desc');

    return results;
  }

  async findByUserIdWithPagination(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const results = await db(this.tableName)
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('reservations.user_id', userId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'reservations.reservation_id',
        'reservations.user_id',
        'reservations.device_id',
        'reservations.inventory_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
        'users.user_id as user_user_id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'users.created_at as user_created_at',
        'users.is_active',
        'users.is_deleted as user_is_deleted',
        'devices.device_id as device_device_id',
        'devices.brand',
        'devices.model',
        'devices.category',
        'devices.description',
        'devices.default_loan_duration_days',
        'devices.created_at as device_created_at',
        'devices.is_deleted',
        'device_inventory.inventory_id as inventory_inventory_id',
        'device_inventory.device_id as inventory_device_id',
        'device_inventory.serial_number',
        'device_inventory.is_available',
        'device_inventory.created_at as inventory_created_at'
      )
      .orderBy('reservations.reserved_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db(this.tableName)
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .where('reservations.user_id', userId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .count('* as count')
      .first();

    return parseInt((result as { count: string }).count, 10);
  }

  async findByDeviceId(deviceId: string): Promise<any[]> {
    const results = await db(this.tableName)
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('reservations.device_id', deviceId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'reservations.reservation_id',
        'reservations.user_id',
        'reservations.device_id',
        'reservations.inventory_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
        'users.user_id as user_user_id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'users.created_at as user_created_at',
        'users.is_active',
        'users.is_deleted as user_is_deleted',
        'devices.device_id as device_device_id',
        'devices.brand',
        'devices.model',
        'devices.category',
        'devices.description',
        'devices.default_loan_duration_days',
        'devices.created_at as device_created_at',
        'devices.is_deleted',
        'device_inventory.inventory_id as inventory_inventory_id',
        'device_inventory.device_id as inventory_device_id',
        'device_inventory.serial_number',
        'device_inventory.is_available',
        'device_inventory.created_at as inventory_created_at'
      )
      .orderBy('reservations.reserved_at', 'desc');

    return results;
  }

  async findById(reservationId: string): Promise<ReservationDto | null> {
    const reservation = await db(this.tableName)
      .where('reservation_id', reservationId)
      .first();

    return reservation ? ReservationFactory.toDto(reservation as ReservationTable) : null;
  }

  async updateStatus(trx: Knex.Transaction, reservationId: string, status: string): Promise<ReservationDto | null> {
    const [updatedReservation] = await trx(this.tableName)
      .where('reservation_id', reservationId)
      .update({ status })
      .returning('*');

    return updatedReservation ? ReservationFactory.toDto(updatedReservation as ReservationTable) : null;
  }

  async markInventoryAsAvailable(trx: Knex.Transaction, inventoryId: string): Promise<void> {
    await trx('device_inventory')
      .where('inventory_id', inventoryId)
      .update({ is_available: true });
  }
}

export default new ReservationRepository();

