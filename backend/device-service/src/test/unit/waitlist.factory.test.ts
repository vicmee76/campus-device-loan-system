/// <reference types="jest" />

import WaitlistFactory from '../../api/factory/waitlist.factory';
import { WaitlistTable } from '../../api/model/waitlist.model';
import { WaitlistDto } from '../../api/dtos/waitlist.dto';

describe('WaitlistFactory - Unit Tests', () => {
  const mockWaitlistTable: WaitlistTable = {
    waitlist_id: 'waitlist-123',
    user_id: 'user-123',
    device_id: 'device-123',
    added_at: new Date('2024-01-01'),
    is_notified: false,
    notified_at: null,
  };

  const mockWaitlistDto: WaitlistDto = {
    waitlistId: 'waitlist-123',
    userId: 'user-123',
    deviceId: 'device-123',
    addedAt: new Date('2024-01-01'),
    isNotified: false,
    notifiedAt: null,
  };

  describe('toDto', () => {
    it('should convert WaitlistTable to WaitlistDto correctly', () => {
      const result = WaitlistFactory.toDto(mockWaitlistTable);

      expect(result).toEqual(mockWaitlistDto);
      expect(result.waitlistId).toBe(mockWaitlistTable.waitlist_id);
      expect(result.userId).toBe(mockWaitlistTable.user_id);
      expect(result.deviceId).toBe(mockWaitlistTable.device_id);
      expect(result.addedAt).toBe(mockWaitlistTable.added_at);
      expect(result.isNotified).toBe(mockWaitlistTable.is_notified);
      expect(result.notifiedAt).toBe(mockWaitlistTable.notified_at);
    });

    it('should handle notified waitlist entry', () => {
      const notifiedTable: WaitlistTable = {
        ...mockWaitlistTable,
        is_notified: true,
        notified_at: new Date('2024-01-02'),
      };

      const result = WaitlistFactory.toDto(notifiedTable);

      expect(result.isNotified).toBe(true);
      expect(result.notifiedAt).toEqual(new Date('2024-01-02'));
    });

    it('should handle null notifiedAt', () => {
      const result = WaitlistFactory.toDto(mockWaitlistTable);

      expect(result.notifiedAt).toBeNull();
    });
  });

  describe('toDtoArray', () => {
    it('should convert array of WaitlistTable to array of WaitlistDto', () => {
      const waitlistTables: WaitlistTable[] = [
        mockWaitlistTable,
        {
          ...mockWaitlistTable,
          waitlist_id: 'waitlist-456',
          user_id: 'user-456',
          is_notified: true,
        },
      ];

      const result = WaitlistFactory.toDtoArray(waitlistTables);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockWaitlistDto);
      expect(result[1].waitlistId).toBe('waitlist-456');
      expect(result[1].userId).toBe('user-456');
      expect(result[1].isNotified).toBe(true);
    });

    it('should return empty array for empty input', () => {
      const result = WaitlistFactory.toDtoArray([]);

      expect(result).toEqual([]);
    });
  });
});

