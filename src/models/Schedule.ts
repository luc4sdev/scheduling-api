import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    BelongsTo
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { User } from './User';
import { Room } from './Room';

export enum ScheduleStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export interface ScheduleAttributes {
    id: string;
    userId: string;
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: ScheduleStatus;
    notes?: string;
}

export interface ScheduleCreationAttributes extends Optional<ScheduleAttributes, 'id' | 'status' | 'notes' | 'endTime'> { }

@Table({
    tableName: 'schedules',
    timestamps: true,
})
export class Schedule extends Model<ScheduleAttributes, ScheduleCreationAttributes> {

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

    @ForeignKey(() => Room)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare roomId: string;

    @BelongsTo(() => Room)
    declare room: Room;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
    })
    declare date: string;

    @Column({
        type: DataType.STRING(5),
        allowNull: false,
    })
    declare startTime: string;

    @Column({
        type: DataType.STRING(5),
        allowNull: false,
    })
    declare endTime: string;

    @Default(ScheduleStatus.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(ScheduleStatus)),
        allowNull: false,
    })
    declare status: ScheduleStatus;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare notes: string;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}