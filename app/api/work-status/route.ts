import { NextRequest, NextResponse } from 'next/server';
import sequelize from '@/lib/database';
import WorkDomain from '@/models/WorkDomain';
import TeamMember from '@/models/TeamMember';
import WeeklyStatus from '@/models/WeeklyStatus';
import { setupAssociations } from '@/lib/associations';

// Initialize database connection and associations
async function initDB() {
  try {
    await sequelize.authenticate();
    
    // Set up associations
    setupAssociations();
    
    await sequelize.sync();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// GET - Fetch all work domains with team members and weekly statuses
export async function GET(request: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    
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
    
    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching work status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work status' },
      { status: 500 }
    );
  }
}

// POST - Create new team member or domain
export async function POST(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();
    
    if (body.type === 'domain') {
      // Create new domain
      const domain = await WorkDomain.create({
        id: body.id,
        name: body.name,
        iconName: body.iconName,
        color: body.color,
        bgColor: body.bgColor,
      });
      
      return NextResponse.json(domain, { status: 201 });
    } else {
      // Create team member
      const member = await TeamMember.create({
        id: body.id,
        name: body.name,
        email: body.email,
        domainId: body.domainId,
      });
      
      return NextResponse.json(member, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}

// PUT - Update weekly status or member details
export async function PUT(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();
    
    // Check if this is a member update (has name, email, or slackChannelId)
    if (body.name || body.email || body.slackChannelId) {
      const member = await TeamMember.findByPk(body.memberId);
      if (!member) {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        );
      }
      
      // Update member details
      await member.update({
        name: body.name || member.name,
        email: body.email || member.email,
        slackChannelId: body.slackChannelId || member.slackChannelId,
      });
      
      return NextResponse.json(member);
    }
    
    // Otherwise, update weekly status
    const [status, created] = await WeeklyStatus.findOrCreate({
      where: {
        memberId: body.memberId,
        weekStart: body.weekStart,
      },
      defaults: {
        id: Date.now().toString(),
        memberId: body.memberId,
        weekStart: body.weekStart,
        currentWeek: '',
        nextWeek: '',
      },
    });
    
    // Update the status
    await status.update({
      currentWeek: body.currentWeek || status.currentWeek,
      nextWeek: body.nextWeek || status.nextWeek,
    });
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error updating:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team member
export async function DELETE(request: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }
    
    const member = await TeamMember.findByPk(memberId);
    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    // Delete all weekly statuses for this member first (to handle foreign key constraints)
    await WeeklyStatus.destroy({
      where: { memberId }
    });
    
    // Then delete the member
    await member.destroy();
    return NextResponse.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
} 