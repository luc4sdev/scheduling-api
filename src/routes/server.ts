import 'reflect-metadata';
import express from 'express';
import { sequelize } from '@/config/database';
import { env } from '@/env';
import cors from 'cors';
import { authMiddleware } from '@/middlewares/auth';
import { UsersController } from '@/controllers/user';
import { AuthController } from '@/controllers/auth';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/sessions/password', AuthController.authenticate);
app.post('/api/users', UsersController.create);

app.use(authMiddleware);
app.get('/api/me', UsersController.me);
app.get('/api/users', UsersController.getAll);
app.get('/api/users/:id', UsersController.getOne);
app.put('/api/users/:id', UsersController.update);
app.delete('/api/users/:id', UsersController.delete);

const startServer = async () => {
    try {
        //await sequelize.sync({ force: true });
        await sequelize.sync();
        console.log('Banco de dados conectado!');

        app.listen(env.PORT, () => {
            console.log(`Servidor rodando na porta ${env.PORT}`);
        });
    } catch (error) {
        console.error('Erro ao conectar no banco:', error);
    }
};

startServer();