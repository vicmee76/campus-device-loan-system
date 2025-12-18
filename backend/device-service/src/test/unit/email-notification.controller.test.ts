/// <reference types="jest" />

import { Request, Response } from 'express';
import { EmailNotificationController } from '../../api/controller/email-notification.controller';
import emailNotificationService from '../../api/services/email-notification.service';
import { getStatusCode } from '../../api/utils/controller.utils';
import { EmailNotificationDto } from '../../api/dtos/email-notification.dto';

jest.mock('../../api/services/email-notification.service');
jest.mock('../../api/utils/controller.utils');

describe('EmailNotificationController - Unit Tests', () => {
  let controller: EmailNotificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockEmailNotificationService = emailNotificationService as jest.Mocked<typeof emailNotificationService>;
  const mockGetStatusCode = getStatusCode as jest.MockedFunction<typeof getStatusCode>;

  beforeEach(() => {
    controller = new EmailNotificationController();
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockGetStatusCode.mockReturnValue(200);
  });

  describe('getEmailById', () => {
    it('should get email by id successfully', async () => {
      const emailId = 'email-123';
      mockRequest.params = { id: emailId };

      const mockEmail: EmailNotificationDto = {
        emailId: 'email-123',
        userId: 'user-123',
        emailAddress: 'user@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'sent',
        attempts: 1,
        errorMessage: null,
        sentAt: new Date(),
        isRead: false,
        createdAt: new Date(),
      };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: mockEmail,
        message: 'Email retrieved successfully',
      };

      mockEmailNotificationService.getEmailById.mockResolvedValue(mockResult);

      await controller.getEmailById(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailById).toHaveBeenCalledWith(emailId);
      expect(mockGetStatusCode).toHaveBeenCalledWith(mockResult);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle not found error', async () => {
      const emailId = 'non-existent';
      mockRequest.params = { id: emailId };

      const mockResult = {
        success: false,
        code: '05' as const,
        data: null,
        message: 'Email with ID non-existent not found',
      };

      mockEmailNotificationService.getEmailById.mockResolvedValue(mockResult);
      mockGetStatusCode.mockReturnValue(404);

      await controller.getEmailById(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailById).toHaveBeenCalledWith(emailId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle validation error', async () => {
      const emailId = '';
      mockRequest.params = { id: emailId };

      const mockResult = {
        success: false,
        code: '09' as const,
        data: null,
        message: 'Email ID is required',
      };

      mockEmailNotificationService.getEmailById.mockResolvedValue(mockResult);
      mockGetStatusCode.mockReturnValue(400);

      await controller.getEmailById(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailById).toHaveBeenCalledWith(emailId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getEmailsByUserId', () => {
    it('should get emails by user id successfully without filters', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = {};

      const mockEmails: EmailNotificationDto[] = [
        {
          emailId: 'email-1',
          userId: 'user-123',
          emailAddress: 'user@example.com',
          subject: 'Subject 1',
          body: 'Body 1',
          status: 'sent',
          attempts: 1,
          errorMessage: null,
          sentAt: new Date(),
          isRead: false,
          createdAt: new Date(),
        },
        {
          emailId: 'email-2',
          userId: 'user-123',
          emailAddress: 'user@example.com',
          subject: 'Subject 2',
          body: 'Body 2',
          status: 'sent',
          attempts: 1,
          errorMessage: null,
          sentAt: new Date(),
          isRead: true,
          createdAt: new Date(),
        },
      ];

      const mockResult = {
        success: true,
        code: '00' as const,
        data: mockEmails,
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {});
      expect(mockGetStatusCode).toHaveBeenCalledWith(mockResult);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should get emails with isRead filter set to true', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = { isRead: 'true' };

      const mockEmails: EmailNotificationDto[] = [
        {
          emailId: 'email-1',
          userId: 'user-123',
          emailAddress: 'user@example.com',
          subject: 'Subject 1',
          body: 'Body 1',
          status: 'sent',
          attempts: 1,
          errorMessage: null,
          sentAt: new Date(),
          isRead: true,
          createdAt: new Date(),
        },
      ];

      const mockResult = {
        success: true,
        code: '00' as const,
        data: mockEmails,
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {
        isRead: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should get emails with isRead filter set to false', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = { isRead: 'false' };

      const mockEmails: EmailNotificationDto[] = [
        {
          emailId: 'email-1',
          userId: 'user-123',
          emailAddress: 'user@example.com',
          subject: 'Subject 1',
          body: 'Body 1',
          status: 'sent',
          attempts: 1,
          errorMessage: null,
          sentAt: new Date(),
          isRead: false,
          createdAt: new Date(),
        },
      ];

      const mockResult = {
        success: true,
        code: '00' as const,
        data: mockEmails,
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {
        isRead: false,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should get emails with limit filter', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = { limit: '10' };

      const mockEmails: EmailNotificationDto[] = [];

      const mockResult = {
        success: true,
        code: '00' as const,
        data: mockEmails,
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should get emails with both isRead and limit filters', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = { isRead: 'true', limit: '5' };

      const mockEmails: EmailNotificationDto[] = [];

      const mockResult = {
        success: true,
        code: '00' as const,
        data: mockEmails,
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {
        isRead: true,
        limit: 5,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle invalid isRead query parameter', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = { isRead: 'invalid' };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: [],
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {
        isRead: undefined,
      });
    });

    it('should handle validation error', async () => {
      const userId = '';
      mockRequest.params = { userId };
      mockRequest.query = {};

      const mockResult = {
        success: false,
        code: '09' as const,
        data: null,
        message: 'User ID is required',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);
      mockGetStatusCode.mockReturnValue(400);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {});
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle empty result', async () => {
      const userId = 'user-123';
      mockRequest.params = { userId };
      mockRequest.query = {};

      const mockResult = {
        success: true,
        code: '00' as const,
        data: [],
        message: 'Emails retrieved successfully',
      };

      mockEmailNotificationService.getEmailsByUserId.mockResolvedValue(mockResult);

      await controller.getEmailsByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.getEmailsByUserId).toHaveBeenCalledWith(userId, {});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('markAsRead', () => {
    it('should mark email as read successfully', async () => {
      const emailId = 'email-123';
      mockRequest.params = { id: emailId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: null,
        message: 'Email marked as read successfully',
      };

      mockEmailNotificationService.markAsRead.mockResolvedValue(mockResult);

      await controller.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.markAsRead).toHaveBeenCalledWith(emailId);
      expect(mockGetStatusCode).toHaveBeenCalledWith(mockResult);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle not found error', async () => {
      const emailId = 'non-existent';
      mockRequest.params = { id: emailId };

      const mockResult = {
        success: false,
        code: '05' as const,
        data: null,
        message: 'Email with ID non-existent not found',
      };

      mockEmailNotificationService.markAsRead.mockResolvedValue(mockResult);
      mockGetStatusCode.mockReturnValue(404);

      await controller.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.markAsRead).toHaveBeenCalledWith(emailId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle validation error', async () => {
      const emailId = '';
      mockRequest.params = { id: emailId };

      const mockResult = {
        success: false,
        code: '09' as const,
        data: null,
        message: 'Email ID is required',
      };

      mockEmailNotificationService.markAsRead.mockResolvedValue(mockResult);
      mockGetStatusCode.mockReturnValue(400);

      await controller.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockEmailNotificationService.markAsRead).toHaveBeenCalledWith(emailId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });
});

