import { db } from '../../database/connection';
import { DeviceTable } from '../model/device.model';

export class DeviceRepository {
  private readonly tableName = 'devices';

  async findById(deviceId: string): Promise<DeviceTable | null> {
    return db(this.tableName)
      .where('device_id', deviceId)
      .where('is_deleted', false)
      .first() as Promise<DeviceTable | null>;
  }
}

export default new DeviceRepository();

