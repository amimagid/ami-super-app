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
  planned: {
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

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  weekStart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  taskType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'work',
  },
}, {
  tableName: 'my_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Define associations
TeamMember.belongsTo(WorkDomain, { 
  foreignKey: 'domainId', 
  as: 'domain',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
WeeklyStatus.belongsTo(TeamMember, { 
  foreignKey: 'memberId', 
  as: 'member',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

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

      {
        id: 'rnd',
        name: 'R&D',
        iconName: 'flask-conical',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      },
    ];

    for (const domain of defaultDomains) {
      await WorkDomain.findOrCreate({
        where: { id: domain.id },
        defaults: domain,
      });
    }

    // Insert default team members if they don't exist
    const defaultTeamMembers = [
      // Advanced Protection
      { id: 'asaf-adv', name: 'Asaf', email: 'asaf@company.com', domainId: 'advanced-protection' },
      { id: 'nirgi-adv', name: 'Nirgi', email: 'nirgi@company.com', domainId: 'advanced-protection' },
      { id: 'yogev-adv', name: 'Yogev', email: 'yogev@company.com', domainId: 'advanced-protection' },
      
      // Platform Security
      { id: 'guy-k-platform', name: 'Guy K', email: 'guy.k@company.com', domainId: 'platform-security' },
      { id: 'guy-h-platform', name: 'Guy H', email: 'guy.h@company.com', domainId: 'platform-security' },
      { id: 'michael-platform', name: 'Michael', email: 'michael@company.com', domainId: 'platform-security' },
      { id: 'ben-l-platform', name: 'Ben L', email: 'ben.l@company.com', domainId: 'platform-security' },
      { id: 'aharon-platform', name: 'Aharon', email: 'aharon@company.com', domainId: 'platform-security' },
      
      // Compliance
      { id: 'vlad-compliance', name: 'Vlad', email: 'vlad@company.com', domainId: 'compliance' },
      { id: 'stevan-compliance', name: 'Stevan', email: 'stevan@company.com', domainId: 'compliance' },
      { id: 'vlada-compliance', name: 'Vlada', email: 'vlada@company.com', domainId: 'compliance' },
      { id: 'milos-compliance', name: 'Milos', email: 'milos@company.com', domainId: 'compliance' },
      { id: 'rade-compliance', name: 'Rade', email: 'rade@company.com', domainId: 'compliance' },
      
      // Threat Protection
      { id: 'muhammad-threat', name: 'Muhammad', email: 'muhammad@company.com', domainId: 'threat-protection' },
      { id: 'or-threat', name: 'Or', email: 'or@company.com', domainId: 'threat-protection' },
      
      // R&D
      { id: 'shani-qa', name: 'Shani', email: 'shani@company.com', domainId: 'rnd' },
      
      // R&D
      { id: 'dudi-rnd', name: 'Dudi', email: 'dudi@company.com', domainId: 'rnd' },
      { id: 'ben-l-rnd', name: 'Ben L', email: 'ben.l@company.com', domainId: 'rnd' },
    ];

    for (const member of defaultTeamMembers) {
      await TeamMember.findOrCreate({
        where: { id: member.id },
        defaults: member,
      });
    }

    console.log('Default work domains and team members created/verified.');
    console.log('Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 