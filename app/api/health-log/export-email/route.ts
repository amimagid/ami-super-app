import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { HealthEntry } from '@/models/HealthEntry'
import { setupAssociations } from '@/lib/associations'
import sequelize from '@/lib/database'

// Initialize database connection and associations
async function initDB() {
  try {
    await sequelize.authenticate();
    setupAssociations();
    await sequelize.sync({ force: false });
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// POST - Export health log data via email
export async function POST(request: NextRequest) {
  try {
    await initDB()
    
    const body = await request.json()
    const { pdfDataUrl, entries } = body

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // You'll need to set this in .env
        pass: process.env.EMAIL_PASS  // You'll need to set this in .env
      }
    })

    // Email content
    const emailContent = `
      <h2>Health Log Report</h2>
      <p>Here's your health log data export with graphs and entries.</p>
      <p><strong>Total Entries:</strong> ${entries.length}</p>
      <p><strong>Date Range:</strong> ${entries.length > 0 ? `${entries[entries.length - 1].date} to ${entries[0].date}` : 'No data'}</p>
      <br>
      <p>Best regards,<br>Your Health Log App</p>
    `

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'amimagid@gmail.com',
      subject: 'Health Log Report - ' + new Date().toLocaleDateString(),
      html: emailContent,
      attachments: [
        {
          filename: `health-log-report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfDataUrl.split(',')[1], // Remove data:application/pdf;base64, prefix
          encoding: 'base64'
        }
      ]
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
} 