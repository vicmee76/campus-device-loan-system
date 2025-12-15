import { injectable } from 'tsyringe';
import deviceInventoryRepository from '../repository/device-inventory.repository';
import { DeviceInventoryWithDeviceDto, DeviceInventoryDto, PaginatedResult } from '../dtos/device-inventory.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import DeviceInventoryFactory from '../factory/device-inventory.factory';
import DeviceFactory from '../factory/device.factory';
import { DeviceInventoryTable } from '../model/device-inventory.model';
import { DeviceTable } from '../model/device.model';
import { logger } from '../utils/logger';

@injectable()
export class DeviceInventoryService {
    async getDeviceInventoryByDeviceId(deviceId: string): Promise<ApiResponse<DeviceInventoryWithDeviceDto[] | null>> {
        logger.debug('getDeviceInventoryByDeviceId called', { deviceId });
        try {
            if (!deviceId) {
                logger.warn('getDeviceInventoryByDeviceId validation failed: deviceId is required');
                return ResponseHelper.validationError('Device ID is required');
            }

            const results = await deviceInventoryRepository.findByDeviceId(deviceId);
            
            const inventoryWithDevices: DeviceInventoryWithDeviceDto[] = results.map((row: any) => {
                const inventory: DeviceInventoryTable = {
                    inventory_id: row.inventory_id,
                    device_id: row.device_id,
                    serial_number: row.serial_number,
                    is_available: row.is_available,
                    created_at: row.created_at,
                };

                const device: DeviceTable = {
                    device_id: row.device_device_id,
                    brand: row.brand,
                    model: row.model,
                    category: row.category,
                    description: row.description,
                    image_url: null,
                    default_loan_duration_days: row.default_loan_duration_days,
                    created_at: row.device_created_at,
                    is_deleted: row.is_deleted,
                };

                const inventoryDto = DeviceInventoryFactory.toDto(inventory);
                const deviceDto = DeviceFactory.toDto(device);
                
                return {
                    ...inventoryDto,
                    device: deviceDto,
                };
            });

            logger.info('Device inventory retrieved successfully', { deviceId, count: inventoryWithDevices.length });
            return ResponseHelper.success(inventoryWithDevices, 'Device inventory retrieved successfully');
        } catch (error) {
            logger.error('getDeviceInventoryByDeviceId failed', error, { deviceId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve device inventory');
        }
    }

    async getAllInventory(options: {
        deviceId?: string;
        serialNumber?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<ApiResponse<PaginatedResult<DeviceInventoryDto> | null>> {
        logger.debug('getAllInventory called', { options });
        try {
            const result = await deviceInventoryRepository.findAll(options);
            logger.info('Inventory retrieved successfully', {
                count: result.data.length,
                totalCount: result.pagination.totalCount,
                page: result.pagination.page,
                options
            });
            return ResponseHelper.success(result, 'Inventory retrieved successfully');
        } catch (error) {
            logger.error('getAllInventory failed', error, { options });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve inventory');
        }
    }

    async getInventoryById(inventoryId: string): Promise<ApiResponse<DeviceInventoryWithDeviceDto | null>> {
        logger.debug('getInventoryById called', { inventoryId });
        try {
            if (!inventoryId) {
                logger.warn('getInventoryById validation failed: inventoryId is required');
                return ResponseHelper.validationError('Inventory ID is required');
            }

            const result = await deviceInventoryRepository.findById(inventoryId);
            
            if (!result) {
                logger.warn('getInventoryById: inventory not found', { inventoryId });
                return ResponseHelper.notFound(`Inventory with ID ${inventoryId} not found`);
            }

            const inventory: DeviceInventoryTable = {
                inventory_id: result.inventory_id,
                device_id: result.device_id,
                serial_number: result.serial_number,
                is_available: result.is_available,
                created_at: result.created_at,
            };

            const device: DeviceTable = {
                device_id: result.device_device_id,
                brand: result.brand,
                model: result.model,
                category: result.category,
                description: result.description,
                image_url: null,
                default_loan_duration_days: result.default_loan_duration_days,
                created_at: result.device_created_at,
                is_deleted: result.is_deleted,
            };

            const inventoryDto = DeviceInventoryFactory.toDto(inventory);
            const deviceDto = DeviceFactory.toDto(device);

            const inventoryWithDevice: DeviceInventoryWithDeviceDto = {
                ...inventoryDto,
                device: deviceDto,
            };

            logger.info('Inventory retrieved successfully', { inventoryId });
            return ResponseHelper.success(inventoryWithDevice, 'Inventory retrieved successfully');
        } catch (error) {
            logger.error('getInventoryById failed', error, { inventoryId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve inventory');
        }
    }
}

export default new DeviceInventoryService();

