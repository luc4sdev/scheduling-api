import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';
import { env } from '@/env';



export const sequelize = new Sequelize(env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    models: [User],
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    timezone: '-03:00',
});