import { WaitlistTable } from '../model/waitlist.model';
import { WaitlistDto } from '../dtos/waitlist.dto';

export class WaitlistFactory {
  static toDto(waitlistTable: WaitlistTable): WaitlistDto {
    return {
      waitlistId: waitlistTable.waitlist_id,
      userId: waitlistTable.user_id,
      deviceId: waitlistTable.device_id,
      addedAt: waitlistTable.added_at,
      isNotified: waitlistTable.is_notified,
      notifiedAt: waitlistTable.notified_at,
    };
  }

  static toDtoArray(waitlistTables: WaitlistTable[]): WaitlistDto[] {
    return waitlistTables.map((waitlistTable) => this.toDto(waitlistTable));
  }
}

export default WaitlistFactory;

