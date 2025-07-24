import { Model, DataTypes } from 'sequelize';
import sequelize from '../lib/database';

class WorkDomain extends Model {
  public id!: string;
  public name!: string;
  public iconName!: string;
  public color!: string;
  public bgColor!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkDomain.init(
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    iconName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bgColor: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'work_domains',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default WorkDomain; 