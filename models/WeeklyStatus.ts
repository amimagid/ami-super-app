import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/database';

class WeeklyStatus extends Model {
  public id!: string;
  public memberId!: string;
  public weekStart!: Date;
  public currentWeek?: string;
  public nextWeek?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WeeklyStatus.init(
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    memberId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'team_members',
        key: 'id',
      },
    },
    weekStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    currentWeek: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextWeek: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'weekly_statuses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['memberId', 'weekStart'],
      },
    ],
  }
);

export default WeeklyStatus; 