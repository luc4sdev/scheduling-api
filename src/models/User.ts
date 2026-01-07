import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export interface UserAttributes {
    id: string;
    name: string;
    lastName: string;
    email: string;
    password?: string;
    cep: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    role: 'USER' | 'ADMIN';
    isActive: boolean;
    permissions: string[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'complement' | 'isActive' | 'permissions'> { }

@Table({
    tableName: 'users',
    timestamps: true,
})
export class User extends Model<UserAttributes, UserCreationAttributes> {

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
    declare lastName: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare password: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare cep: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare street: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare number: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare complement: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare neighborhood: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare city: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare state: string;

    @Default('USER')
    @Column({
        type: DataType.ENUM('USER', 'ADMIN'),
        allowNull: false,
    })
    declare role: 'USER' | 'ADMIN';


    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    declare isActive: boolean;

    @Default(['APPOINTMENTS', 'LOGS'])
    @Column({
        type: DataType.JSON,
        allowNull: false,
    })
    declare permissions: string[];

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}