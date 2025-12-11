import { injectable } from 'tsyringe';
import deviceRepository from '../repository/device.repository';
import { DeviceDto, PaginatedResult, DeviceWithInventoryDto } from '../dtos/device.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { logger } from '../utils/logger';

@injectable()
export class DeviceService {
    async getDeviceById(deviceId: string): Promise<ApiResponse<DeviceDto | null>> {
        logger.debug('getDeviceById called', { deviceId });
        try {
            if (!deviceId) {
                logger.warn('getDeviceById validation failed: deviceId is required');
                return ResponseHelper.validationError('Device ID is required');
            }

            const device = await deviceRepository.findById(deviceId);
            if (!device) {
                logger.warn('getDeviceById: device not found', { deviceId });
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
        search?: string;
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

    async availableDevices(options: {
        search?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<ApiResponse<PaginatedResult<DeviceWithInventoryDto> | null>> {
        logger.debug('availableDevices called', { options });
        try {
            const result = await deviceRepository.availableDevices(options);

            logger.info('Available devices retrieved successfully', {
                count: result.data.length,
                totalCount: result.pagination.totalCount,
                page: result.pagination.page,
                options
            });
            return ResponseHelper.success(result, 'Available devices retrieved successfully');
        } catch (error) {
            logger.error('availableDevices failed', error, { options });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve devices');
        }
    }
}

export default new DeviceService();

