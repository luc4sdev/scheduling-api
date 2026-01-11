import nodemailer from 'nodemailer';
import { env } from '../env';
import { format, parseISO } from 'date-fns';

export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: env.MAIL_USER,
                pass: env.MAIL_PASS,
            },
        });
    }

    public async sendSchedulingConfirmation(userEmail: string, userName: string, dateString: string, time: string) {
        try {
            const parsedDate = parseISO(dateString);
            const formattedDate = format(parsedDate, 'dd/MM/yyyy');

            const info = await this.transporter.sendMail({
                from: `"Scheduling App" <${env.MAIL_USER}>`,
                to: userEmail,
                subject: '🔔 Confirmação de Agendamento',
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h1>Olá, ${userName}!</h1>
                        <p>Seu agendamento foi confirmado com sucesso.</p>
                        <p><strong>Data:</strong> ${formattedDate}</p>
                        <p><strong>Horário:</strong> ${time}</p>
                        <p>Te aguardamos!</p>
                    </div>
                `,
            });
            return info;
        } catch (error) {
            console.error("Erro ao enviar email:", error);
            return null;
        }
    }

    public async notifyAdminNewSchedule(adminEmail: string, userName: string, userEmail: string, dateString: string, time: string) {
        try {
            const parsedDate = parseISO(dateString);
            const formattedDate = format(parsedDate, 'dd/MM/yyyy');

            const info = await this.transporter.sendMail({
                from: `"Sistema de Agendamento" <${env.MAIL_USER}>`,
                to: adminEmail,
                subject: `🔔 Novo Agendamento: ${userName}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #000;">Novo Agendamento Realizado</h2>
                        <p>Um usuário acabou de realizar um agendamento no sistema.</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                        <p><strong>Usuário:</strong> ${userName} (${userEmail})</p>
                        <p><strong>Data:</strong> ${formattedDate}</p>
                        <p><strong>Horário:</strong> ${time}</p>
                    </div>
                `,
            });
            return info;
        } catch (error) {
            console.error("Erro ao enviar email:", error);
            return null;
        }
    }
}