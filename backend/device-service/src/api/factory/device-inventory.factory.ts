import { DeviceInventoryTable } from '../model/device-inventory.model';
import { DeviceInventoryDto, CreateDeviceInventoryDto } from '../dtos/device-inventory.dto';

export class DeviceInventoryFactory {
    static toDto(inventoryTable: DeviceInventoryTable): DeviceInventoryDto {
        return {
            inventoryId: inventoryTable.inventory_id,
            deviceId: inventoryTable.device_id,
            serialNumber: inventoryTable.serial_number,
            isAvailable: inventoryTable.is_available,
            createdAt: inventoryTable.created_at,
        };
    }

    static toDtoArray(inventoryTables: DeviceInventoryTable[]): DeviceInventoryDto[] {
        return inventoryTables.map((inventoryTable) => this.toDto(inventoryTable));
    }

    static toTable(inventoryDto: Partial<DeviceInventoryDto>): Partial<DeviceInventoryTable> {
        const table: Partial<DeviceInventoryTable> = {};

        if (inventoryDto.inventoryId !== undefined) table.inventory_id = inventoryDto.inventoryId;
        if (inventoryDto.deviceId !== undefined) table.device_id = inventoryDto.deviceId;
        if (inventoryDto.serialNumber !== undefined) table.serial_number = inventoryDto.serialNumber;
        if (inventoryDto.isAvailable !== undefined) table.is_available = inventoryDto.isAvailable;
        if (inventoryDto.createdAt !== undefined) table.created_at = inventoryDto.createdAt;

        return table;
    }

    static createDto(data: CreateDeviceInventoryDto & { inventoryId?: string; createdAt?: Date }): DeviceInventoryDto {
        return {
            inventoryId: data.inventoryId || '',
            deviceId: data.deviceId,
            serialNumber: data.serialNumber,
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
            createdAt: data.createdAt || new Date(),
        };
    }
}

export default DeviceInventoryFactory;

