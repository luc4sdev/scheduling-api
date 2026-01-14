import { env } from '../env';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Scheduling API',
            version: '1.0.0',
            description: 'API para gerenciamento de agendamentos e salas',
            contact: {
                name: 'Lucas Pereira',
            },
        },
        servers: [
            {
                url: '/',
                description: 'Servidor Atual',
            },
            {
                url: `http://localhost:${env.PORT}`,
                description: 'Servidor Local',
            },
            {
                url: `https://scheduling-api-ws9u.onrender.com`,
                description: 'Servidor Produção',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/docs/schemas.ts', './src/docs/auth.ts', './src/docs/log.ts', './src/docs/user.ts', './src/docs/room.ts', './src/docs/schedule.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);