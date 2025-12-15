import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { WaitlistTable } from '../model/waitlist.model';
import { WaitlistDto } from '../dtos/waitlist.dto';
import WaitlistFactory from '../factory/waitlist.factory';

@injectable()
export class WaitlistRepository {
  private readonly tableName = 'waitlist';

  async create(userId: string, deviceId: string): Promise<WaitlistDto> {
    const [waitlist] = await db(this.tableName)
      .insert({
        user_id: userId,
        device_id: deviceId,
        added_at: db.fn.now(),
        is_notified: false,
      })
      .returning('*');

    return WaitlistFactory.toDto(waitlist as WaitlistTable);
  }

  async findByUser(userId: string): Promise<WaitlistDto[]> {
    const waitlists = await db(this.tableName)
      .where('user_id', userId)
      .orderBy('added_at', 'desc');

    return WaitlistFactory.toDtoArray(waitlists as WaitlistTable[]);
  }

  async findByDevice(deviceId: string): Promise<WaitlistDto[]> {
    const waitlists = await db(this.tableName)
      .where('device_id', deviceId)
      .orderBy('added_at', 'desc');

    return WaitlistFactory.toDtoArray(waitlists as WaitlistTable[]);
  }

  async remove(userId: string, deviceId: string): Promise<boolean> {
    const result = await db(this.tableName)
      .where('user_id', userId)
      .where('device_id', deviceId)
      .where('is_notified', false)
      .delete();

    return result > 0;
  }

  async getPosition(deviceId: string, addedAt: Date): Promise<number> {
    const result = await db(this.tableName)
      .where('device_id', deviceId)
      .where('is_notified', false)
      .where('added_at', '<=', addedAt)
      .count('* as count')
      .first();

    return parseInt((result as { count: string }).count, 10);
  }

  async getNextUser(deviceId: string): Promise<WaitlistDto | null> {
    const waitlist = await db(this.tableName)
      .where('device_id', deviceId)
      .where('is_notified', false)
      .orderBy('added_at', 'asc')
      .first();

    return waitlist ? WaitlistFactory.toDto(waitlist as WaitlistTable) : null;
  }

  async markAsNotified(waitlistId: string): Promise<WaitlistDto | null> {
    const [updated] = await db(this.tableName)
      .where('waitlist_id', waitlistId)
      .update({
        is_notified: true,
        notified_at: db.fn.now(),
      })
      .returning('*');

    return updated ? WaitlistFactory.toDto(updated as WaitlistTable) : null;
  }

  async findAllWithDetails(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    let baseQuery = db(this.tableName)
      .join('users', 'waitlist.user_id', 'users.user_id')
      .join('devices', 'waitlist.device_id', 'devices.device_id')
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false);

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    let dataQuery = baseQuery
      .select(
        'waitlist.waitlist_id',
        'waitlist.user_id',
        'waitlist.device_id',
        'waitlist.added_at',
        'waitlist.is_notified',
        'waitlist.notified_at',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'devices.brand',
        'devices.model',
        'devices.category'
      )
      .orderBy('waitlist.added_at', 'desc');

    if (options.page && options.pageSize) {
      const offset = (page - 1) * pageSize;
      dataQuery = dataQuery.limit(pageSize).offset(offset);
    }

    const results = await dataQuery;
    return results;
  }

  async findByUserIdWithDetails(userId: string): Promise<any[]> {
    const results = await db(this.tableName)
      .join('users', 'waitlist.user_id', 'users.user_id')
      .join('devices', 'waitlist.device_id', 'devices.device_id')
      .where('waitlist.user_id', userId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'waitlist.waitlist_id',
        'waitlist.user_id',
        'waitlist.device_id',
        'waitlist.added_at',
        'waitlist.is_notified',
        'waitlist.notified_at',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'devices.brand',
        'devices.model',
        'devices.category'
      )
      .orderBy('waitlist.added_at', 'desc');

    return results;
  }

  async findByDeviceIdWithDetails(deviceId: string): Promise<any[]> {
    const results = await db(this.tableName)
      .join('users', 'waitlist.user_id', 'users.user_id')
      .join('devices', 'waitlist.device_id', 'devices.device_id')
      .where('waitlist.device_id', deviceId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'waitlist.waitlist_id',
        'waitlist.user_id',
        'waitlist.device_id',
        'waitlist.added_at',
        'waitlist.is_notified',
        'waitlist.notified_at',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.role',
        'devices.brand',
        'devices.model',
        'devices.category'
      )
      .orderBy('waitlist.added_at', 'asc');

    return results;
  }
}

export default new WaitlistRepository();

