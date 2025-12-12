import request from 'supertest';
import app from '../../device-app';
import waitlistRepository from '../../api/repository/waitlist.repository';
import { WaitlistDto } from '../../api/dtos/waitlist.dto';
import { verifyToken } from '../../api/utils/jwt.utils';

// Mock repositories
jest.mock('../../api/repository/waitlist.repository');

describe('Waitlist API - Integration Tests', () => {
  const studentUserId = 'student-123';
  const deviceId = 'device-123';
  const mockToken = 'valid-student-token';

  const mockWaitlistRepository = waitlistRepository as jest.Mocked<typeof waitlistRepository>;
  const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock JWT verification
    mockVerifyToken.mockReturnValue({
      userId: studentUserId,
      email: 'student@example.com',
      role: 'student',
    });
  });

  describe('POST /v1/api/waitlist/:deviceId/join', () => {
    const mockWaitlistEntry: WaitlistDto = {
      waitlistId: 'waitlist-123',
      userId: studentUserId,
      deviceId: deviceId,
      addedAt: new Date(),
      isNotified: false,
      notifiedAt: null,
    };

    it('should join waitlist successfully', async () => {
      mockWaitlistRepository.findByUser.mockResolvedValue([]);
      mockWaitlistRepository.create.mockResolvedValue(mockWaitlistEntry);
      mockWaitlistRepository.getPosition.mockResolvedValue(1);

      const response = await request(app)
        .post(`/v1/api/waitlist/${deviceId}/join`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.waitlistId).toBeDefined();
      expect(response.body.data.userId).toBe(studentUserId);
      expect(response.body.data.deviceId).toBe(deviceId);
      expect(response.body.data.position).toBe(1);
    });

    it('should return error when already on waitlist', async () => {
      mockWaitlistRepository.findByUser.mockResolvedValue([mockWaitlistEntry]);

      const response = await request(app)
        .post(`/v1/api/waitlist/${deviceId}/join`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockWaitlistRepository.create).not.toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post(`/v1/api/waitlist/${deviceId}/join`)
        .expect(401);
    });
  });

  describe('DELETE /v1/api/waitlist/:deviceId/remove', () => {
    it('should remove from waitlist successfully', async () => {
      mockWaitlistRepository.remove.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/v1/api/waitlist/${deviceId}/remove`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockWaitlistRepository.remove).toHaveBeenCalledWith(studentUserId, deviceId);
    });

    it('should return 404 when not on waitlist', async () => {
      mockWaitlistRepository.remove.mockResolvedValue(false);

      const response = await request(app)
        .delete(`/v1/api/waitlist/${deviceId}/remove`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .delete(`/v1/api/waitlist/${deviceId}/remove`)
        .expect(401);
    });
  });
});

