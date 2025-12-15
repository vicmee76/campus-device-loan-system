/// <reference types="jest" />
import { WaitlistRepository } from '../../api/repository/waitlist.repository';
import db from '../../database/connection';
import WaitlistFactory from '../../api/factory/waitlist.factory';

jest.mock('../../database/connection');
jest.mock('../../api/factory/waitlist.factory');

describe('WaitlistRepository', () => {
  let repository: WaitlistRepository;
  let mockQuery: any;
  let mockDb: jest.MockedFunction<any>;

  const createThenable = (value: any) => {
    const thenable = {
      where: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      first: jest.fn(),
      count: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(value).then(resolve)),
      catch: jest.fn(),
    };
    return thenable;
  };

  beforeEach(() => {
    repository = new WaitlistRepository();
    mockQuery = createThenable([]);
    mockDb = db as jest.MockedFunction<any>;
    mockDb.mockReturnValue(mockQuery);
    (db.fn as any) = { now: jest.fn() };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return waitlist DTO', async () => {
      const mockWaitlist = {
        waitlist_id: 'waitlist-123',
        user_id: 'user-123',
        device_id: 'device-123',
        added_at: new Date(),
        is_notified: false,
        notified_at: null,
      };
      const mockWaitlistDto = {
        waitlistId: 'waitlist-123',
        userId: 'user-123',
        deviceId: 'device-123',
        addedAt: new Date(),
        isNotified: false,
        notifiedAt: null,
      };

      mockQuery.insert.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockWaitlist]);
      (WaitlistFactory.toDto as jest.Mock).mockReturnValue(mockWaitlistDto);

      const result = await repository.create('user-123', 'device-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        device_id: 'device-123',
        added_at: db.fn.now(),
        is_notified: false,
      });
      expect(WaitlistFactory.toDto).toHaveBeenCalledWith(mockWaitlist);
      expect(result).toEqual(mockWaitlistDto);
    });
  });

  describe('findByUser', () => {
    it('should return array of waitlist DTOs for user', async () => {
      const mockWaitlists = [
        {
          waitlist_id: 'waitlist-1',
          user_id: 'user-123',
          device_id: 'device-1',
          added_at: new Date(),
          is_notified: false,
          notified_at: null,
        },
        {
          waitlist_id: 'waitlist-2',
          user_id: 'user-123',
          device_id: 'device-2',
          added_at: new Date(),
          is_notified: true,
          notified_at: new Date(),
        },
      ];
      const mockWaitlistDtos = [
        {
          waitlistId: 'waitlist-1',
          userId: 'user-123',
          deviceId: 'device-1',
          addedAt: new Date(),
          isNotified: false,
          notifiedAt: null,
        },
        {
          waitlistId: 'waitlist-2',
          userId: 'user-123',
          deviceId: 'device-2',
          addedAt: new Date(),
          isNotified: true,
          notifiedAt: new Date(),
        },
      ];

      const mockQueryForFind = createThenable(mockWaitlists);
      mockDb.mockReturnValueOnce(mockQueryForFind);
      (WaitlistFactory.toDtoArray as jest.Mock).mockReturnValue(mockWaitlistDtos);

      const result = await repository.findByUser('user-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('added_at', 'desc');
      expect(WaitlistFactory.toDtoArray).toHaveBeenCalledWith(mockWaitlists);
      expect(result).toEqual(mockWaitlistDtos);
    });
  });

  describe('findByDevice', () => {
    it('should return array of waitlist DTOs for device', async () => {
      const mockWaitlists = [
        {
          waitlist_id: 'waitlist-1',
          user_id: 'user-1',
          device_id: 'device-123',
          added_at: new Date(),
          is_notified: false,
          notified_at: null,
        },
      ];
      const mockWaitlistDtos = [
        {
          waitlistId: 'waitlist-1',
          userId: 'user-1',
          deviceId: 'device-123',
          addedAt: new Date(),
          isNotified: false,
          notifiedAt: null,
        },
      ];

      const mockQueryForFind = createThenable(mockWaitlists);
      mockDb.mockReturnValueOnce(mockQueryForFind);
      (WaitlistFactory.toDtoArray as jest.Mock).mockReturnValue(mockWaitlistDtos);

      const result = await repository.findByDevice('device-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('device_id', 'device-123');
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('added_at', 'desc');
      expect(result).toEqual(mockWaitlistDtos);
    });
  });

  describe('remove', () => {
    it('should return true when waitlist entry is removed', async () => {
      mockQuery.delete.mockResolvedValue(1);

      const result = await repository.remove('user-123', 'device-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
      expect(mockQuery.where).toHaveBeenCalledWith('is_notified', false);
      expect(result).toBe(true);
    });

    it('should return false when waitlist entry does not exist', async () => {
      mockQuery.delete.mockResolvedValue(0);

      const result = await repository.remove('user-123', 'device-123');

      expect(result).toBe(false);
    });
  });

  describe('getPosition', () => {
    it('should return position in waitlist', async () => {
      const mockResult = { count: '5' };

      mockQuery.count.mockReturnThis();
      mockQuery.first.mockResolvedValue(mockResult);

      const result = await repository.getPosition('device-123', new Date());

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
      expect(mockQuery.where).toHaveBeenCalledWith('is_notified', false);
      expect(mockQuery.where).toHaveBeenCalledWith('added_at', '<=', expect.any(Date));
      expect(result).toBe(5);
    });
  });

  describe('getNextUser', () => {
    it('should return next waitlist entry', async () => {
      const mockWaitlist = {
        waitlist_id: 'waitlist-123',
        user_id: 'user-123',
        device_id: 'device-123',
        added_at: new Date(),
        is_notified: false,
        notified_at: null,
      };
      const mockWaitlistDto = {
        waitlistId: 'waitlist-123',
        userId: 'user-123',
        deviceId: 'device-123',
        addedAt: new Date(),
        isNotified: false,
        notifiedAt: null,
      };

      mockQuery.orderBy.mockReturnThis();
      mockQuery.first.mockResolvedValue(mockWaitlist);
      (WaitlistFactory.toDto as jest.Mock).mockReturnValue(mockWaitlistDto);

      const result = await repository.getNextUser('device-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
      expect(mockQuery.where).toHaveBeenCalledWith('is_notified', false);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('added_at', 'asc');
      expect(WaitlistFactory.toDto).toHaveBeenCalledWith(mockWaitlist);
      expect(result).toEqual(mockWaitlistDto);
    });

    it('should return null when no next user exists', async () => {
      mockQuery.orderBy.mockReturnThis();
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.getNextUser('device-123');

      expect(result).toBeNull();
    });
  });

  describe('markAsNotified', () => {
    it('should mark waitlist entry as notified and return DTO', async () => {
      const mockUpdated = {
        waitlist_id: 'waitlist-123',
        user_id: 'user-123',
        device_id: 'device-123',
        added_at: new Date(),
        is_notified: true,
        notified_at: new Date(),
      };
      const mockWaitlistDto = {
        waitlistId: 'waitlist-123',
        userId: 'user-123',
        deviceId: 'device-123',
        addedAt: new Date(),
        isNotified: true,
        notifiedAt: new Date(),
      };

      mockQuery.update.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockUpdated]);
      (WaitlistFactory.toDto as jest.Mock).mockReturnValue(mockWaitlistDto);

      const result = await repository.markAsNotified('waitlist-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQuery.where).toHaveBeenCalledWith('waitlist_id', 'waitlist-123');
      expect(mockQuery.update).toHaveBeenCalledWith({
        is_notified: true,
        notified_at: db.fn.now(),
      });
      expect(WaitlistFactory.toDto).toHaveBeenCalledWith(mockUpdated);
      expect(result).toEqual(mockWaitlistDto);
    });

    it('should return null when waitlist entry does not exist', async () => {
      mockQuery.update.mockReturnThis();
      mockQuery.returning.mockResolvedValue([]);

      const result = await repository.markAsNotified('waitlist-123');

      expect(result).toBeNull();
    });
  });

  describe('findAllWithDetails', () => {
    it('should return waitlist entries with user and device details', async () => {
      const mockResults = [
        {
          waitlist_id: 'waitlist-1',
          user_id: 'user-1',
          device_id: 'device-1',
          added_at: new Date(),
          is_notified: false,
          notified_at: null,
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'student',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findAllWithDetails();

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQueryForFind.join).toHaveBeenCalledWith('users', 'waitlist.user_id', 'users.user_id');
      expect(mockQueryForFind.join).toHaveBeenCalledWith('devices', 'waitlist.device_id', 'devices.device_id');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('users.is_deleted', false);
      expect(mockQueryForFind.where).toHaveBeenCalledWith('devices.is_deleted', false);
      expect(result).toEqual(mockResults);
    });

    it('should apply pagination', async () => {
      const mockQueryForFind = createThenable([]);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      await repository.findAllWithDetails({ page: 2, pageSize: 10 });

      expect(mockQueryForFind.limit).toHaveBeenCalledWith(10);
      expect(mockQueryForFind.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('findByUserIdWithDetails', () => {
    it('should return waitlist entries with details for specific user', async () => {
      const mockResults = [
        {
          waitlist_id: 'waitlist-1',
          user_id: 'user-123',
          device_id: 'device-1',
          added_at: new Date(),
          is_notified: false,
          notified_at: null,
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'student',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findByUserIdWithDetails('user-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('waitlist.user_id', 'user-123');
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('waitlist.added_at', 'desc');
      expect(result).toEqual(mockResults);
    });
  });

  describe('findByDeviceIdWithDetails', () => {
    it('should return waitlist entries with details for specific device', async () => {
      const mockResults = [
        {
          waitlist_id: 'waitlist-1',
          user_id: 'user-1',
          device_id: 'device-123',
          added_at: new Date(),
          is_notified: false,
          notified_at: null,
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'student',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findByDeviceIdWithDetails('device-123');

      expect(mockDb).toHaveBeenCalledWith('waitlist');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('waitlist.device_id', 'device-123');
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('waitlist.added_at', 'asc');
      expect(result).toEqual(mockResults);
    });
  });
});

