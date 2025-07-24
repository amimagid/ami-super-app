import HealthEntry from '@/models/HealthEntry';
import WorkDomain from '@/models/WorkDomain';
import TeamMember from '@/models/TeamMember';
import WeeklyStatus from '@/models/WeeklyStatus';
import sequelize from './database';

// Health Entries
export const healthService = {
  async getAllEntries() {
    const entries = await HealthEntry.findAll({
      order: [['timestamp', 'DESC']],
    });
    return entries.map(entry => entry.toJSON());
  },

  async createEntry(entryData: any) {
    const entry = await HealthEntry.create(entryData);
    return entry.toJSON();
  },

  async updateEntry(id: string, entryData: any) {
    const entry = await HealthEntry.findByPk(id);
    if (!entry) throw new Error('Entry not found');
    
    await entry.update(entryData);
    return entry.toJSON();
  },

  async deleteEntry(id: string) {
    const entry = await HealthEntry.findByPk(id);
    if (!entry) throw new Error('Entry not found');
    
    await entry.destroy();
    return true;
  },

  async getEntriesByDateRange(startDate: Date, endDate: Date) {
    const entries = await HealthEntry.findAll({
      where: {
        timestamp: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['timestamp', 'DESC']],
    });
    return entries.map(entry => entry.toJSON());
  },
};

// Work Status
export const workService = {
  async getAllDomains(weekStart?: string) {
    const domains = await WorkDomain.findAll({
      include: [
        {
          model: TeamMember,
          as: 'members',
          include: [
            {
              model: WeeklyStatus,
              as: 'weeklyStatuses',
              where: weekStart ? { weekStart } : undefined,
              required: false,
            },
          ],
        },
      ],
    });
    return domains.map(domain => domain.toJSON());
  },

  async createTeamMember(memberData: any) {
    const member = await TeamMember.create(memberData);
    return member.toJSON();
  },

  async updateWeeklyStatus(memberId: string, weekStart: string, statusData: any) {
    const [status, created] = await WeeklyStatus.findOrCreate({
      where: { memberId, weekStart },
      defaults: {
        id: Date.now().toString(),
        memberId,
        weekStart,
        currentWeek: statusData.currentWeek || '',
        nextWeek: statusData.nextWeek || '',
      },
    });

    if (!created) {
      await status.update(statusData);
    }

    return status.toJSON();
  },

  async deleteTeamMember(id: string) {
    const member = await TeamMember.findByPk(id);
    if (!member) throw new Error('Team member not found');
    
    await member.destroy();
    return true;
  },
};

// Database initialization
export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}; 