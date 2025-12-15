import { db } from "../../database/connection";
import { WaitlistTable } from "../model/waitlist.model";

export class WaitlistRepository {
  private readonly tableName = 'waitlist';

  async nextUser(deviceId: string): Promise<WaitlistTable | undefined> {
    return db(this.tableName)
      .where({ device_id: deviceId, is_notified: false })
      .orderBy("added_at", "asc")
      .first() as Promise<WaitlistTable | undefined>;
  }

  async markNotified(waitlistId: string): Promise<number> {
    return db(this.tableName)
      .update({ is_notified: true, notified_at: db.fn.now() })
      .where({ waitlist_id: waitlistId });
  }
}

