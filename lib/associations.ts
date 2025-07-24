import WorkDomain from '@/models/WorkDomain';
import TeamMember from '@/models/TeamMember';
import WeeklyStatus from '@/models/WeeklyStatus';
import { HealthEntry } from '@/models/HealthEntry';

let associationsSetup = false;

export function setupAssociations() {
  if (associationsSetup) {
    return; // Already set up
  }
  
  // WorkDomain associations
  WorkDomain.hasMany(TeamMember, { foreignKey: 'domainId', as: 'members' });
  TeamMember.belongsTo(WorkDomain, { foreignKey: 'domainId', as: 'domain' });
  
  // TeamMember associations
  TeamMember.hasMany(WeeklyStatus, { foreignKey: 'memberId', as: 'weeklyStatuses' });
  WeeklyStatus.belongsTo(TeamMember, { foreignKey: 'memberId', as: 'member' });
  
  // HealthEntry doesn't need associations for now, but we ensure it's loaded
  // This ensures the model is registered with Sequelize
  
  associationsSetup = true;
} 