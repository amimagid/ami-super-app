import { DataTypes, Model } from 'sequelize'
import sequelize from '@/lib/database'

export interface HealthEntryAttributes {
  id: string
  date: string
  weight: number | null
  bpAMRight: string | null
  bpAMLeft: string | null
  bpAMTime: string | null
  bpAMNotes: string | null
  bpPMRight: string | null
  bpPMLeft: string | null
  bpPMTime: string | null
  bpPMNotes: string | null
  workout: string | null
  created_at?: Date
  updated_at?: Date
}

export class HealthEntry extends Model<HealthEntryAttributes> implements HealthEntryAttributes {
  public id!: string
  public date!: string
  public weight!: number | null
  public bpAMRight!: string | null
  public bpAMLeft!: string | null
  public bpAMTime!: string | null
  public bpAMNotes!: string | null
  public bpPMRight!: string | null
  public bpPMLeft!: string | null
  public bpPMTime!: string | null
  public bpPMNotes!: string | null
  public workout!: string | null
  public readonly created_at!: Date
  public readonly updated_at!: Date
}

HealthEntry.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    bpAMRight: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bpAMLeft: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bpAMTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    bpAMNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bpPMRight: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bpPMLeft: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bpPMTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    bpPMNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    workout: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'health_entries',
    timestamps: true,
    underscored: true,
  }
) 