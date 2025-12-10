import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { DeviceTable } from '../model/device.model';
import { DeviceDto, PaginatedResult, PaginationMeta } from '../dtos/device.dto';
import DeviceFactory from '../factory/device.factory';

@injectable()
export class DeviceRepository {
    private readonly tableName = 'devices';

    async findById(deviceId: string, includeDeleted: boolean = false): Promise<DeviceDto | null> {
        let query = db(this.tableName).where('device_id', deviceId);

        if (!includeDeleted)
            query = query.where('is_deleted', false);

        const device = await query.first();
        return device ? DeviceFactory.toDto(device as DeviceTable) : null;
    }

    async findAll(options: {
        brand?: string;
        model?: string;
        category?: string;
        includeDeleted?: boolean;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PaginatedResult<DeviceDto>> {
        let baseQuery = db(this.tableName);

        if (options.brand)
            baseQuery = baseQuery.whereILike('brand', `%${options.brand}%`);

        if (options.model)
            baseQuery = baseQuery.whereILike('model', `%${options.model}%`);

        if (options.category)
            baseQuery = baseQuery.whereILike('category', `%${options.category}%`);

        if (!options.includeDeleted)
            baseQuery = baseQuery.where('is_deleted', false);

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
}

export default new DeviceRepository();

