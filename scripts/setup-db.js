const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'superapp_user',
  password: process.env.DB_PASSWORD || 'superapp_pass',
  database: process.env.DB_NAME || 'ami_super_app',
  logging: console.log,
});

// Define models directly in the script
const HealthEntry = sequelize.define('HealthEntry', {
  id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('weight', 'morning_bp', 'evening_bp', 'workout'),
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  systolic: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  diastolic: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  arm: {
    type: DataTypes.ENUM('right', 'left'),
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_entries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const WorkDomain = sequelize.define('WorkDomain', {
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
}, {
  tableName: 'work_domains',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const TeamMember = sequelize.define('TeamMember', {
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
  },
  slackChannelId: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'team_members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const WeeklyStatus = sequelize.define('WeeklyStatus', {
  id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
  },
  memberId: {
    type: DataTypes.STRING(255),
    allowNull: false,
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
}, {
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
});

// Define associations
TeamMember.belongsTo(WorkDomain, { foreignKey: 'domainId', as: 'domain' });
WeeklyStatus.belongsTo(TeamMember, { foreignKey: 'memberId', as: 'member' });

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Synchronizing database...');
    await sequelize.sync({ force: false, alter: true });
    console.log('Database synchronized successfully.');

    // Insert default work domains if they don't exist
    const defaultDomains = [
      {
        id: 'platform-security',
        name: 'Platform Security',
        iconName: 'shield',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      {
        id: 'threat-protection',
        name: 'Threat Protection',
        iconName: 'alert-triangle',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      },
      {
        id: 'compliance',
        name: 'Compliance',
        iconName: 'file-check',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        id: 'advanced-protection',
        name: 'Advanced Protection',
        iconName: 'zap',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
    ];

    for (const domain of defaultDomains) {
      await WorkDomain.findOrCreate({
        where: { id: domain.id },
        defaults: domain,
      });
    }

    console.log('Default work domains created/verified.');
    console.log('Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 