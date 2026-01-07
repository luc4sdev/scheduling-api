import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    ForeignKey,
    BelongsTo
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { User } from './User';

export interface LogAttributes {
    id: string;
    userId: string;
    action: string;
    module: string;
    details?: object;
    createdAt?: Date | string;
}

export interface LogCreationAttributes extends Optional<LogAttributes, 'id' | 'createdAt' | 'details'> { }

@Table({
    tableName: 'logs',
    timestamps: true,
    updatedAt: false,
})
export class Log extends Model<LogAttributes, LogCreationAttributes> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare userId: string;

    @BelongsTo(() => User)
    declare user: User;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare action: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare module: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare details: object;

    @CreatedAt
    declare createdAt: Date;
}