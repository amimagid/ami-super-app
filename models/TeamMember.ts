import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/database';

class TeamMember extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public domainId!: string;
  public slackChannelId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamMember.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    domainId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'work_domains',
        key: 'id',
      },
    },
    slackChannelId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'team_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default TeamMember; 