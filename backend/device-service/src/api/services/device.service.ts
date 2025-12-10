import { injectable } from 'tsyringe';
import deviceRepository from '../repository/device.repository';
import { DeviceDto, PaginatedResult } from '../dtos/device.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { logger } from '../utils/logger';

@injectable()
export class DeviceService {
    async getDeviceById(deviceId: string, includeDeleted: boolean = false): Promise<ApiResponse<DeviceDto | null>> {
        logger.debug('getDeviceById called', { deviceId, includeDeleted });
        try {
            if (!deviceId) {
                logger.warn('getDeviceById validation failed: deviceId is required');
                return ResponseHelper.validationError('Device ID is required');
            }

            const device = await deviceRepository.findById(deviceId, includeDeleted);
            if (!device) {
                logger.warn('getDeviceById: device not found', { deviceId, includeDeleted });
                return ResponseHelper.notFound(`Device with ID ${deviceId} not found`);
            }

            logger.info('Device retrieved successfully', { deviceId });
            return ResponseHelper.success(device, 'Device retrieved successfully');
        } catch (error) {
            logger.error('getDeviceById failed', error, { deviceId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve device');
        }
    }

    async getAllDevices(options: {
        brand?: string;
        model?: string;
        category?: string;
        includeDeleted?: boolean;
        page?: number;
        pageSize?: number;
    } = {}): Promise<ApiResponse<PaginatedResult<DeviceDto> | null>> {
        logger.debug('getAllDevices called', { options });
        try {
            const result = await deviceRepository.findAll(options);
            logger.info('Devices retrieved successfully', {
                count: result.data.length,
                totalCount: result.pagination.totalCount,
                page: result.pagination.page,
                options
            });
            return ResponseHelper.success(result, 'Devices retrieved successfully');
        } catch (error) {
            logger.error('getAllDevices failed', error, { options });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve devices');
        }
    }
}

export default new DeviceService();

