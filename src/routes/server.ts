import 'reflect-metadata';
import { app } from '../app';
import express from 'express';
import { env } from '../env';
import cors from 'cors';
import { authMiddleware } from '../middlewares/auth';
import { UsersController } from '../controllers/user';
import { AuthController } from '../controllers/auth';
import { LogsController } from '../controllers/log';
import { RoomsController } from '../controllers/room';
import { SchedulesController } from '../controllers/schedule';
import { UsersService } from '../services/user';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import { sequelize } from '../config/database';

app.use(cors({
    origin: ["http://localhost:3000"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    credentials: true,
    optionsSuccessStatus: 204
}));
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.post('/api/sessions/password', AuthController.authenticate);
app.post('/api/users', UsersController.create);

app.use(authMiddleware);

app.get('/api/me', UsersController.me);
app.get('/api/users', UsersController.getAll);
app.get('/api/users/:id', UsersController.getOne);
app.put('/api/users/:id', UsersController.update);
app.delete('/api/users/:id', UsersController.delete);

app.get('/api/logs', LogsController.getLogs);

app.get('/api/rooms', RoomsController.getAll);
app.post('/api/rooms', RoomsController.create);
app.put('/api/rooms/:id', RoomsController.update);
app.delete('/api/rooms/:id', RoomsController.delete);

app.get('/api/schedules/availability', SchedulesController.getAvailability);
app.get('/api/schedules', SchedulesController.getAll);
app.post('/api/schedules', SchedulesController.create);
app.patch('/api/schedules/:id/status', SchedulesController.updateStatus);

const startServer = async () => {
    try {
        //await sequelize.sync({ alter: true });
        //await sequelize.sync({ force: true });
        await sequelize.sync();
        console.log('Banco de dados conectado!');

        const usersService = new UsersService();
        await usersService.createDefaultAdminUser();

        app.listen(env.PORT, () => {
            console.log(`Servidor rodando na porta ${env.PORT}`);
        });
    } catch (error) {
        console.error('Erro ao conectar no banco:', error);
    }
};

startServer();