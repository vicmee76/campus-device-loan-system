import { db } from "../../database/connection";

export class InventoryRepository {
  private readonly tableName = 'device_inventory';

  async markAvailable(inventoryId: string): Promise<number> {
    return db(this.tableName)
      .update({ is_available: true })
      .where({ inventory_id: inventoryId });
  }
}

