import { DeviceTable } from '../model/device.model';
import { DeviceDto, CreateDeviceDto } from '../dtos/device.dto';

export class DeviceFactory {
    static toDto(deviceTable: DeviceTable): DeviceDto {
        return {
            deviceId: deviceTable.device_id,
            brand: deviceTable.brand,
            model: deviceTable.model,
            category: deviceTable.category,
            description: deviceTable.description,
            defaultLoanDurationDays: deviceTable.default_loan_duration_days,
            createdAt: deviceTable.created_at,
            isDeleted: deviceTable.is_deleted,
        };
    }

    static toDtoArray(deviceTables: DeviceTable[]): DeviceDto[] {
        return deviceTables.map((deviceTable) => this.toDto(deviceTable));
    }

    static toTable(deviceDto: Partial<DeviceDto>): Partial<DeviceTable> {
        const table: Partial<DeviceTable> = {};

        if (deviceDto.deviceId !== undefined) table.device_id = deviceDto.deviceId;
        if (deviceDto.brand !== undefined) table.brand = deviceDto.brand;
        if (deviceDto.model !== undefined) table.model = deviceDto.model;
        if (deviceDto.category !== undefined) table.category = deviceDto.category;
        if (deviceDto.description !== undefined) table.description = deviceDto.description;
        if (deviceDto.defaultLoanDurationDays !== undefined) table.default_loan_duration_days = deviceDto.defaultLoanDurationDays;
        if (deviceDto.createdAt !== undefined) table.created_at = deviceDto.createdAt;
        if (deviceDto.isDeleted !== undefined) table.is_deleted = deviceDto.isDeleted;

        return table;
    }

    static createDto(data: CreateDeviceDto & { deviceId?: string; createdAt?: Date }): DeviceDto {
        return {
            deviceId: data.deviceId || '',
            brand: data.brand,
            model: data.model,
            category: data.category,
            description: data.description || null,
            defaultLoanDurationDays: data.defaultLoanDurationDays || 2,
            createdAt: data.createdAt || new Date(),
            isDeleted: false,
        };
    }
}

export default DeviceFactory;

