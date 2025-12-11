import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { DeviceTable } from '../model/device.model';
import { DeviceDto, PaginatedResult, PaginationMeta, DeviceWithInventoryDto } from '../dtos/device.dto';
import DeviceFactory from '../factory/device.factory';

@injectable()
export class DeviceRepository {
    private readonly tableName = 'devices';

    async findById(deviceId: string): Promise<DeviceDto | null> {
        const device = await db(this.tableName)
            .where('device_id', deviceId)
            .where('is_deleted', false)
            .first();

        return device ? DeviceFactory.toDto(device as DeviceTable) : null;
    }

    async findAll(options: {
        search?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PaginatedResult<DeviceDto>> {
        let baseQuery = db(this.tableName).where('is_deleted', false);

        if (options.search) {
            const searchTerm = options.search.trim();
            if (searchTerm) {
                baseQuery = baseQuery.andWhere((builder) => {
                    builder
                        .whereILike('brand', `${searchTerm}%`)
                        .orWhereILike('model', `${searchTerm}%`)
                        .orWhereILike('category', `${searchTerm}%`);
                });
            }
        }

        const totalCountResult = await baseQuery.clone().count('* as count').first();
        const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

        let dataQuery = baseQuery.clone().orderBy('created_at', 'desc');

        const page = options.page || 1;
        const pageSize = options.pageSize || 10;

        if (options.page && options.pageSize) {
            const offset = (page - 1) * pageSize;
            dataQuery = dataQuery.limit(pageSize).offset(offset);
        }

        const devices = await dataQuery;
        const deviceDtos = DeviceFactory.toDtoArray(devices as DeviceTable[]);

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
            data: deviceDtos,
        };
    }

    async availableDevices(options: {
        search?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PaginatedResult<DeviceWithInventoryDto>> {
        // Build base query with join (same structure as findAll but with inventory join)
        let baseQuery = db(this.tableName)
            .leftJoin('device_inventory', 'devices.device_id', 'device_inventory.device_id')
            .where('devices.is_deleted', false);

        // Apply search filter (same as findAll)
        if (options.search) {
            const searchTerm = options.search.trim();
            if (searchTerm) {
                baseQuery = baseQuery.andWhere((builder) => {
                    builder
                        .whereILike('devices.brand', `${searchTerm}%`)
                        .orWhereILike('devices.model', `${searchTerm}%`)
                        .orWhereILike('devices.category', `${searchTerm}%`);
                });
            }
        }

        // Get total count of distinct devices matching the filter
        const totalCountResult = await baseQuery
            .clone()
            .countDistinct('devices.device_id as count')
            .first();
        const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

        // Build the grouped query
        let dataQuery = baseQuery
            .clone()
            .select(
                'devices.device_id',
                'devices.brand',
                'devices.model',
                'devices.category',
                'devices.description',
                db.raw('COUNT(device_inventory.inventory_id)::int as total_units'),
                db.raw('COUNT(device_inventory.inventory_id) FILTER (WHERE device_inventory.is_available = true)::int as available_units')
            )
            .groupBy('devices.device_id', 'devices.brand', 'devices.model', 'devices.category', 'devices.description')
            .orderBy('devices.brand')
            .orderBy('devices.model');

        const page = options.page || 1;
        const pageSize = options.pageSize || 10;

        if (options.page && options.pageSize) {
            const offset = (page - 1) * pageSize;
            dataQuery = dataQuery.limit(pageSize).offset(offset);
        }

        const results = await dataQuery;

        const devices: DeviceWithInventoryDto[] = results.map((row: any) => ({
            deviceId: row.device_id,
            brand: row.brand,
            model: row.model,
            category: row.category,
            description: row.description,
            totalUnits: parseInt(row.total_units, 10) || 0,
            availableUnits: parseInt(row.available_units, 10) || 0,
        }));

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
            data: devices,
        };
    }
}

export default new DeviceRepository();

