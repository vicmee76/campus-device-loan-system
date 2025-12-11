import { injectable } from 'tsyringe';
import { Knex } from 'knex';
import db from '../../database/connection';
import { ReservationTable } from '../model/reservation.model';
import { ReservationDto, PaginatedResult, PaginationMeta } from '../dtos/reservation.dto';
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
  } = {}): Promise<PaginatedResult<ReservationDto>> {
    let baseQuery = db(this.tableName);

    const totalCountResult = await baseQuery.clone().count('* as count').first();
    const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

    let dataQuery = baseQuery.clone().orderBy('reserved_at', 'desc');

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    if (options.page && options.pageSize) {
      const offset = (page - 1) * pageSize;
      dataQuery = dataQuery.limit(pageSize).offset(offset);
    }

    const reservations = await dataQuery;
    const reservationDtos = ReservationFactory.toDtoArray(reservations as ReservationTable[]);

    const totalPages = Math.ceil(totalCount / pageSize);
    const pagination: PaginationMeta = {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      pagination,
      data: reservationDtos,
    };
  }

  async findByUserId(userId: string): Promise<any[]> {
    const results = await db(this.tableName)
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('reservations.user_id', userId)
      .where('devices.is_deleted', false)
      .select(
        'reservations.reservation_id',
        'reservations.user_id',
        'reservations.device_id',
        'reservations.inventory_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
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

  async findByDeviceId(deviceId: string): Promise<any[]> {
    const results = await db(this.tableName)
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('reservations.device_id', deviceId)
      .where('devices.is_deleted', false)
      .select(
        'reservations.reservation_id',
        'reservations.user_id',
        'reservations.device_id',
        'reservations.inventory_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
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
}

export default new ReservationRepository();

