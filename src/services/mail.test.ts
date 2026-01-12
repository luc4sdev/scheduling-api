import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MailService } from './mail';

vi.mock('../env', () => ({
    env: {
        MAIL_USER: 'test@gmail.com',
        MAIL_PASS: 'test-password'
    }
}));

vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn()
    }
}));

vi.mock('date-fns', () => ({
    format: vi.fn((date, pattern) => '08/01/2026'),
    parseISO: vi.fn((dateString) => new Date(dateString))
}));

import nodemailer from 'nodemailer';

describe('MailService', () => {
    let mailService: MailService;
    let mockSendMail: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSendMail = vi.fn().mockResolvedValue({
            messageId: '<test@gmail.com>',
            accepted: ['user@example.com'],
            rejected: [],
            response: '250 Message Accepted'
        });

        const mockTransporter = {
            sendMail: mockSendMail
        };

        vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as any);

        mailService = new MailService();
    });

    describe('Constructor', () => {
        it('should create transporter with correct configuration', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                tls: {
                    rejectUnauthorized: false,
                },
                auth: {
                    user: 'test@gmail.com',
                    pass: 'test-password'
                }
            });
        });

        it('should initialize MailService successfully', () => {
            expect(mailService).toBeDefined();
            expect(mailService).toBeInstanceOf(MailService);
        });
    });

    describe('sendSchedulingConfirmation', () => {
        const testEmail = 'user@example.com';
        const testName = 'John Doe';
        const testDate = '2026-01-08';
        const testTime = '14:30';

        it('should send scheduling confirmation email successfully', async () => {
            const result = await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: '"Scheduling App" <test@gmail.com>',
                    to: testEmail,
                    subject: '🔔 Confirmação de Agendamento'
                })
            );

            expect(result).toBeDefined();
            expect(result?.messageId).toBe('<test@gmail.com>');
            expect(result?.accepted).toContain(testEmail);
        });

        it('should include user name in email body', async () => {
            await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(testName);
        });

        it('should include formatted date in email body', async () => {
            await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('08/01/2026');
        });

        it('should include time in email body', async () => {
            await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(testTime);
        });

        it('should return null when sending fails', async () => {
            mockSendMail.mockRejectedValue(new Error('SMTP Error'));

            const result = await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            expect(result).toBeNull();
        });

        it('should handle invalid email format gracefully', async () => {
            const invalidEmail = 'not-an-email';
            const result = await mailService.sendSchedulingConfirmation(invalidEmail, testName, testDate, testTime);

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: invalidEmail
                })
            );
        });

        it('should handle special characters in user name', async () => {
            const specialName = 'José da Silva';
            await mailService.sendSchedulingConfirmation(testEmail, specialName, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(specialName);
        });

        it('should parse ISO date correctly', async () => {
            const { parseISO } = await import('date-fns');
            await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            expect(parseISO).toHaveBeenCalledWith(testDate);
        });

        it('should format date using date-fns format function', async () => {
            const { format } = await import('date-fns');
            await mailService.sendSchedulingConfirmation(testEmail, testName, testDate, testTime);

            expect(format).toHaveBeenCalledWith(expect.any(Date), 'dd/MM/yyyy');
        });
    });

    describe('notifyAdminNewSchedule', () => {
        const adminEmail = 'admin@example.com';
        const userName = 'Jane Doe';
        const userEmail = 'jane@example.com';
        const testDate = '2026-01-15';
        const testTime = '10:00';

        it('should send admin notification email successfully', async () => {
            const result = await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: '"Sistema de Agendamento" <test@gmail.com>',
                    to: adminEmail,
                    subject: expect.stringContaining(userName)
                })
            );

            expect(result).toBeDefined();
            expect(result?.messageId).toBe('<test@gmail.com>');
        });

        it('should include admin email as recipient', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.to).toBe(adminEmail);
        });

        it('should include user name in subject', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.subject).toContain(userName);
        });

        it('should include user name in email body', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(userName);
        });

        it('should include user email in email body', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(userEmail);
        });

        it('should include formatted date in email body', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('08/01/2026');
        });

        it('should include time in email body', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(testTime);
        });

        it('should return null when sending fails', async () => {
            mockSendMail.mockRejectedValue(new Error('Network Error'));

            const result = await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            expect(result).toBeNull();
        });

        it('should handle network errors gracefully', async () => {
            mockSendMail.mockRejectedValue(new Error('SMTP Connection Failed'));

            const result = await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            expect(result).toBeNull();
        });

        it('should have correct email subject format', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.subject).toBe(`🔔 Novo Agendamento: ${userName}`);
        });

        it('should use correct from address', async () => {
            await mailService.notifyAdminNewSchedule(adminEmail, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.from).toBe('"Sistema de Agendamento" <test@gmail.com>');
        });

        it('should send to correct admin email', async () => {
            const differentAdmin = 'different-admin@example.com';
            await mailService.notifyAdminNewSchedule(differentAdmin, userName, userEmail, testDate, testTime);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.to).toBe(differentAdmin);
        });
    });

    describe('Error Handling', () => {
        it('should handle sendSchedulingConfirmation errors without throwing', async () => {
            mockSendMail.mockRejectedValue(new Error('Connection refused'));

            const result = await mailService.sendSchedulingConfirmation('user@example.com', 'John', '2026-01-08', '14:00');

            expect(result).toBeNull();
        });

        it('should handle notifyAdminNewSchedule errors without throwing', async () => {
            mockSendMail.mockRejectedValue(new Error('Authentication failed'));

            const result = await mailService.notifyAdminNewSchedule('admin@example.com', 'John', 'user@example.com', '2026-01-08', '14:00');

            expect(result).toBeNull();
        });

        it('should handle TypeError in sendSchedulingConfirmation', async () => {
            mockSendMail.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

            const result = await mailService.sendSchedulingConfirmation('user@example.com', 'John', '2026-01-08', '14:00');

            expect(result).toBeNull();
        });

        it('should handle TypeError in notifyAdminNewSchedule', async () => {
            mockSendMail.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

            const result = await mailService.notifyAdminNewSchedule('admin@example.com', 'John', 'user@example.com', '2026-01-08', '14:00');

            expect(result).toBeNull();
        });
    });

    describe('HTML Email Content', () => {
        it('should generate valid HTML structure for scheduling confirmation', async () => {
            await mailService.sendSchedulingConfirmation('user@example.com', 'John Doe', '2026-01-08', '14:30');

            const callArgs = mockSendMail.mock.calls[0][0];
            const html = callArgs.html;

            expect(html).toContain('<div');
            expect(html).toContain('</div>');
            expect(html).toContain('<h1>');
            expect(html).toContain('</h1>');
            expect(html).toContain('<p>');
            expect(html).toContain('</p>');
            expect(html).toContain('font-family');
        });

        it('should generate valid HTML structure for admin notification', async () => {
            await mailService.notifyAdminNewSchedule('admin@example.com', 'Jane Doe', 'jane@example.com', '2026-01-15', '10:00');

            const callArgs = mockSendMail.mock.calls[0][0];
            const html = callArgs.html;

            expect(html).toContain('<div');
            expect(html).toContain('</div>');
            expect(html).toContain('<h2');
            expect(html).toContain('</h2>');
            expect(html).toContain('<hr');
        });
    });

    describe('Email Response Handling', () => {
        it('should return sendMail response with messageId', async () => {
            const result = await mailService.sendSchedulingConfirmation('user@example.com', 'John', '2026-01-08', '14:00');

            expect(result?.messageId).toBe('<test@gmail.com>');
        });

        it('should return sendMail response with accepted array', async () => {
            const result = await mailService.sendSchedulingConfirmation('user@example.com', 'John', '2026-01-08', '14:00');

            expect(Array.isArray(result?.accepted)).toBe(true);
        });

        it('should return sendMail response with rejected array', async () => {
            const result = await mailService.sendSchedulingConfirmation('user@example.com', 'John', '2026-01-08', '14:00');

            expect(Array.isArray(result?.rejected)).toBe(true);
        });

        it('should return sendMail response with response string', async () => {
            const result = await mailService.sendSchedulingConfirmation('user@example.com', 'John', '2026-01-08', '14:00');

            expect(typeof result?.response).toBe('string');
        });
    });
});
