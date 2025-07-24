# Ami Super App

A modern, personal super app built with Next.js, TypeScript, and Tailwind CSS. This application combines health tracking and work status management in one beautiful interface.

## Features

### 🏥 Health Log
- **Weight Tracking**: Log your weight with optional timestamps and notes
- **Blood Pressure Monitoring**: Track morning and evening blood pressure readings
- **Workout Logging**: Record your workouts with detailed notes
- **Daily Log View**: See all your health data for any selected date
- **CSV Import/Export**: Upload historical data or export your logs
- **Analytics & Charts**: Beautiful visualizations of your health trends
- **Averages & Statistics**: Track your progress with calculated averages

### 💼 Work Status
- **Four Security Domains**: 
  - Platform Security
  - Threat Protection
  - Compliance
  - Advanced Protection
- **Team Member Management**: Add and manage team members for each domain
- **Weekly Status Tracking**: Current week accomplishments and next week plans
- **Week Navigation**: Navigate between different weeks easily
- **Persistent Storage**: All data is saved locally in your browser

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **CSV Processing**: PapaParse
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for MySQL database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ami-super-app
   ```

2. **Set up the database**
   ```bash
   # Start MySQL database with Docker
   docker-compose up -d
   
   # Wait for database to be ready (about 30 seconds)
   ```

3. **Create environment file**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your database settings if needed
   ```

4. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Production Deployment

### AWS Lightsail Deployment

To deploy your AMI Super App to AWS Lightsail:

1. **Follow the complete deployment guide**: [AWS_LIGHTSAIL_DEPLOYMENT.md](./AWS_LIGHTSAIL_DEPLOYMENT.md)
2. **Quick setup on Lightsail instance**:
   ```bash
   # Copy and run the setup script on your Lightsail instance
   curl -fsSL https://raw.githubusercontent.com/yourusername/ami-super-app/main/scripts/setup-lightsail.sh | bash
   ```
3. **Deploy the application**:
   ```bash
   npm run deploy
   ```

### Deployment Features

- **Docker Containerization**: Full containerized deployment
- **MySQL Database**: Persistent data storage
- **SSL Support**: Automatic HTTPS with Let's Encrypt
- **Domain Support**: Custom domain configuration
- **Backup System**: Database backup scripts
- **Monitoring**: Health checks and logging

## Usage

### Health Log

1. **Adding Entries**: Click "Add Entry" to log weight, blood pressure, or workouts
2. **Daily View**: Select any date to see your health data for that day
3. **Charts View**: Switch to analytics to see trends and averages
4. **CSV Import**: Upload existing health data in CSV format
5. **Export Data**: Download your health data as CSV

### Work Status

1. **Add Team Members**: Click "Add Team Member" to add people to domains
2. **Weekly Navigation**: Use the arrows to navigate between weeks
3. **Update Status**: Click the edit button to add current week status or next week plans
4. **Domain Management**: Each domain has its own team and status tracking

## Data Storage

All data is stored in a MySQL database. This means:
- ✅ Persistent data across devices
- ✅ Data backup and recovery
- ✅ Multi-user support (future)
- ✅ Better data integrity
- ✅ Scalable architecture

## Email Export Setup

To enable the email export feature, you need to configure Gmail SMTP settings:

1. **Create a Gmail App Password**:
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"

2. **Update Environment Variables**:
   - Edit `.env.local` file
   - Replace `your-email@gmail.com` with your Gmail address
   - Replace `your-app-password` with the app password you generated

```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

3. **Restart the Application**:
   ```bash
   npm run dev
   ```

The email export feature will send PDF reports to `amimagid@gmail.com` with:
- Health log summary
- Blood pressure averages (daily, weekly, monthly)
- Complete entries table (up to 50 entries)
- Professional formatting

## CSV Format

### Health Log CSV
Your CSV should have the following columns:
```csv
type,timestamp,value,systolic,diastolic,arm,note
weight,2024-01-15T08:00:00,70.5,,,,
morning_bp,2024-01-15T08:00:00,,120,80,right,Good reading
evening_bp,2024-01-15T20:00:00,,118,78,left,Evening reading
workout,2024-01-15T18:00:00,,,,"30 min cardio"
```

### Supported Entry Types
- `weight`: Use `value` field for weight in kg
- `morning_bp` / `evening_bp`: Use `systolic` and `diastolic` fields, and `arm` field (right/left)
- `workout`: Use `note` field for workout description

## Customization

### Adding New Health Metrics
To add new health tracking types, modify the `HealthEntry` interface in `components/HealthLog.tsx` and update the form logic.

### Adding New Work Domains
To add new work domains, modify the `domains` array in `components/WorkStatus.tsx`.

### Styling
The app uses Tailwind CSS with custom color schemes:
- Health features use green (`health-*`) colors
- Work features use orange (`work-*`) colors
- Primary actions use blue (`primary-*`) colors

## Development

### Project Structure
```
ami-super-app/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── HealthLog.tsx      # Health tracking component
│   └── WorkStatus.tsx     # Work status component
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
└── README.md             # This file
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on the repository. 