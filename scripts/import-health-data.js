const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'superapp_user',
  password: process.env.DB_PASSWORD || 'superapp_pass',
  database: process.env.DB_NAME || 'ami_super_app',
  logging: false,
});

// Define HealthEntry model
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

async function importHealthData() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Read CSV file
    const csvPath = path.join(__dirname, 'Health_Log_-_Updated_through_July_25.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Parse CSV (skip header)
    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty rows
      if (!line.trim()) {
        continue;
      }

      // Simple CSV parsing that handles quoted fields
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim()); // Add the last column
      
      // Skip rows without enough data
      if (columns.length < 2 || !columns[0]) {
        continue;
      }

      const date = columns[0];
      const weight = columns[1] || null;
      const bpAMRight = columns[2] || null;
      const bpAMLeft = columns[3] || null;
      const bpAMTime = columns[4] || null;
      const bpAMNotes = columns[5] || null;
      const bpPMRight = columns[6] || null;
      const bpPMLeft = columns[7] || null;
      const bpPMTime = columns[8] || null;
      const bpPMNotes = columns[9] || null;
      const workout = columns[10] || null;

      // Only create entry if there's at least some data
      if (weight || bpAMRight || bpAMLeft || bpPMRight || bpPMLeft || workout) {
        entries.push({
          id: `import-${date}`,
          date: date,
          weight: weight ? parseFloat(weight) : null,
          bpAMRight: bpAMRight,
          bpAMLeft: bpAMLeft,
          bpAMTime: bpAMTime,
          bpAMNotes: bpAMNotes,
          bpPMRight: bpPMRight,
          bpPMLeft: bpPMLeft,
          bpPMTime: bpPMTime,
          bpPMNotes: bpPMNotes,
          workout: workout
        });
      }
    }

    console.log(`Found ${entries.length} entries to import`);

    // Clear existing data
    console.log('Clearing existing health entries...');
    await HealthEntry.destroy({ where: {} });

    // Import new data
    console.log('Importing health data...');
    for (const entry of entries) {
      await HealthEntry.create(entry);
    }

    console.log(`Successfully imported ${entries.length} health entries!`);
    
    // Verify import
    const count = await HealthEntry.count();
    console.log(`Total health entries in database: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importHealthData(); 