/// <reference types="jest" />

import ReservationFactory from '../../api/factory/reservation.factory';
import { ReservationTable } from '../../api/model/reservation.model';
import { ReservationDto } from '../../api/dtos/reservation.dto';

describe('ReservationFactory - Unit Tests', () => {
  const mockReservationTable: ReservationTable = {
    reservation_id: 'reservation-123',
    user_id: 'user-123',
    device_id: 'device-123',
    inventory_id: 'inventory-123',
    reserved_at: new Date('2024-01-01'),
    due_date: new Date('2024-01-03'),
    status: 'pending',
  };

  const mockReservationDto: ReservationDto = {
    reservationId: 'reservation-123',
    userId: 'user-123',
    deviceId: 'device-123',
    inventoryId: 'inventory-123',
    reservedAt: new Date('2024-01-01'),
    dueDate: new Date('2024-01-03'),
    status: 'pending',
  };

  describe('toDto', () => {
    it('should convert ReservationTable to ReservationDto correctly', () => {
      const result = ReservationFactory.toDto(mockReservationTable);

      expect(result).toEqual(mockReservationDto);
      expect(result.reservationId).toBe(mockReservationTable.reservation_id);
      expect(result.userId).toBe(mockReservationTable.user_id);
      expect(result.deviceId).toBe(mockReservationTable.device_id);
      expect(result.inventoryId).toBe(mockReservationTable.inventory_id);
      expect(result.reservedAt).toBe(mockReservationTable.reserved_at);
      expect(result.dueDate).toBe(mockReservationTable.due_date);
      expect(result.status).toBe(mockReservationTable.status);
    });

    it('should handle different status values', () => {
      const statuses = ['pending', 'collected', 'cancelled', 'returned'];

      statuses.forEach((status) => {
        const table: ReservationTable = {
          ...mockReservationTable,
          status,
        };

        const result = ReservationFactory.toDto(table);

        expect(result.status).toBe(status);
      });
    });
  });

  describe('toDtoArray', () => {
    it('should convert array of ReservationTable to array of ReservationDto', () => {
      const reservationTables: ReservationTable[] = [
        mockReservationTable,
        {
          ...mockReservationTable,
          reservation_id: 'reservation-456',
          status: 'collected',
        },
      ];

      const result = ReservationFactory.toDtoArray(reservationTables);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockReservationDto);
      expect(result[1].reservationId).toBe('reservation-456');
      expect(result[1].status).toBe('collected');
    });

    it('should return empty array for empty input', () => {
      const result = ReservationFactory.toDtoArray([]);

      expect(result).toEqual([]);
    });
  });

  describe('toTable', () => {
    it('should convert ReservationDto to ReservationTable correctly', () => {
      const result = ReservationFactory.toTable(mockReservationDto);

      expect(result.reservation_id).toBe(mockReservationDto.reservationId);
      expect(result.user_id).toBe(mockReservationDto.userId);
      expect(result.device_id).toBe(mockReservationDto.deviceId);
      expect(result.inventory_id).toBe(mockReservationDto.inventoryId);
      expect(result.reserved_at).toBe(mockReservationDto.reservedAt);
      expect(result.due_date).toBe(mockReservationDto.dueDate);
      expect(result.status).toBe(mockReservationDto.status);
    });

    it('should handle partial ReservationDto', () => {
      const partialDto: Partial<ReservationDto> = {
        status: 'cancelled',
        reservationId: 'reservation-789',
      };

      const result = ReservationFactory.toTable(partialDto);

      expect(result.status).toBe('cancelled');
      expect(result.reservation_id).toBe('reservation-789');
      expect(result.user_id).toBeUndefined();
    });

    it('should only include defined fields', () => {
      const minimalDto: Partial<ReservationDto> = {
        reservationId: 'reservation-999',
      };

      const result = ReservationFactory.toTable(minimalDto);

      expect(result.reservation_id).toBe('reservation-999');
      expect(result.user_id).toBeUndefined();
      expect(result.device_id).toBeUndefined();
    });
  });
});

