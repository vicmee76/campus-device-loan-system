import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { DeviceInventoryTable } from '../model/device-inventory.model';
import { DeviceInventoryDto, CreateDeviceInventoryDto, UpdateDeviceInventoryDto, PaginatedResult, PaginationMeta } from '../dtos/device-inventory.dto';
import DeviceInventoryFactory from '../factory/device-inventory.factory';

@injectable()
export class DeviceInventoryRepository {
    private readonly tableName = 'device_inventory';

    async create(inventoryData: CreateDeviceInventoryDto): Promise<DeviceInventoryDto> {
        const [inventory] = await db(this.tableName)
            .insert({
                device_id: inventoryData.deviceId,
                serial_number: inventoryData.serialNumber,
                is_available: inventoryData.isAvailable !== undefined ? inventoryData.isAvailable : true,
            })
            .returning('*');

        return DeviceInventoryFactory.toDto(inventory as DeviceInventoryTable);
    }

    async findById(inventoryId: string): Promise<any | null> {
        const result = await db(this.tableName)
            .join('devices', 'device_inventory.device_id', 'devices.device_id')
            .where('device_inventory.inventory_id', inventoryId)
            .where('devices.is_deleted', false)
            .select(
                'device_inventory.inventory_id',
                'device_inventory.device_id',
                'device_inventory.serial_number',
                'device_inventory.is_available',
                'device_inventory.created_at',
                'devices.device_id as device_device_id',
                'devices.brand',
                'devices.model',
                'devices.category',
                'devices.description',
                'devices.default_loan_duration_days',
                'devices.created_at as device_created_at',
                'devices.is_deleted'
            )
            .first();

        return result || null;
    }

    async findByDeviceId(deviceId: string): Promise<any[]> {
        return await db(this.tableName)
            .join('devices', 'device_inventory.device_id', 'devices.device_id')
            .where('device_inventory.device_id', deviceId)
            .where('devices.is_deleted', false)
            .select(
                'device_inventory.inventory_id',
                'device_inventory.device_id',
                'device_inventory.serial_number',
                'device_inventory.is_available',
                'device_inventory.created_at',
                'devices.device_id as device_device_id',
                'devices.brand',
                'devices.model',
                'devices.category',
                'devices.description',
                'devices.default_loan_duration_days',
                'devices.created_at as device_created_at',
                'devices.is_deleted'
            )
            .orderBy('device_inventory.created_at', 'desc');
    }

    async findAll(options: {
        deviceId?: string;
        serialNumber?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PaginatedResult<DeviceInventoryDto>> {
        let baseQuery = db(this.tableName);

        if (options.deviceId)
            baseQuery = baseQuery.where('device_id', options.deviceId);

        if (options.serialNumber)
            baseQuery = baseQuery.whereILike('serial_number', `%${options.serialNumber}%`);

        const totalCountResult = await baseQuery.clone().count('* as count').first();
        const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

        let dataQuery = baseQuery.clone().orderBy('created_at', 'desc');

        const page = options.page || 1;
        const pageSize = options.pageSize || 10;

        if (options.page && options.pageSize) {
            const offset = (page - 1) * pageSize;
            dataQuery = dataQuery.limit(pageSize).offset(offset);
        }

        const inventories = await dataQuery;
        const inventoryDtos = DeviceInventoryFactory.toDtoArray(inventories as DeviceInventoryTable[]);

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
            data: inventoryDtos,
        };
    }

    async update(inventoryId: string, inventoryData: UpdateDeviceInventoryDto): Promise<DeviceInventoryDto | null> {
        const updateData = DeviceInventoryFactory.toTable(inventoryData);

        const [updatedInventory] = await db(this.tableName)
            .where('inventory_id', inventoryId)
            .update(updateData)
            .returning('*');

        return updatedInventory ? DeviceInventoryFactory.toDto(updatedInventory as DeviceInventoryTable) : null;
    }

    async delete(inventoryId: string): Promise<boolean> {
        const result = await db(this.tableName)
            .where('inventory_id', inventoryId)
            .delete();

        return result > 0;
    }

    async findBySerialNumber(serialNumber: string, deviceId?: string): Promise<DeviceInventoryDto | null> {
        let query = db(this.tableName).where('serial_number', serialNumber);

        if (deviceId)
            query = query.where('device_id', deviceId);

        const inventory = await query.first();
        return inventory ? DeviceInventoryFactory.toDto(inventory as DeviceInventoryTable) : null;
    }
}

export default new DeviceInventoryRepository();

