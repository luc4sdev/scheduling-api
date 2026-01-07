import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    HasMany
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Schedule } from './Schedule';


export interface RoomAttributes {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    isActive: boolean;
}

export interface RoomCreationAttributes extends Optional<RoomAttributes, 'id' | 'isActive'> { }

@Table({
    tableName: 'rooms',
    timestamps: true,
})
export class Room extends Model<RoomAttributes, RoomCreationAttributes> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare startTime: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare endTime: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 30
    })
    declare slotDuration: number;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    declare isActive: boolean;

    @HasMany(() => Schedule)
    declare schedules: Schedule[];

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}