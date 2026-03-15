const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MONGO_URI = process.env.DB_STRING;

if (!MONGO_URI) {
  console.error('Error: DB_STRING is not defined in .env');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const currentBackupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function backupJson() {
  ensureDir(currentBackupPath);
  console.log(`Starting JSON backup to ${currentBackupPath}...`);

  try {
    await mongoose.connect(MONGO_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dbPath = path.join(currentBackupPath, 'json_db');
    ensureDir(dbPath);

    for (const col of collections) {
      console.log(`Exporting collection: ${col.name}`);
      const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
      fs.writeFileSync(path.join(dbPath, `${col.name}.json`), JSON.stringify(data, null, 2));
    }
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('JSON DB Backup failed:', error.message);
    return false;
  }
}

async function restoreJson(backupName) {
  const restorePath = path.join(BACKUP_DIR, backupName, 'json_db');
  if (!fs.existsSync(restorePath)) {
    console.error(`Error: JSON backup not found in ${restorePath}`);
    return false;
  }

  try {
    await mongoose.connect(MONGO_URI);
    const files = fs.readdirSync(restorePath);

    for (const file of files) {
      const colName = file.replace('.json', '');
      console.log(`Importing collection: ${colName}`);
      const data = JSON.parse(fs.readFileSync(path.join(restorePath, file), 'utf8'));
      
      if (data.length > 0) {
        // Optional: Clear collection before import
        await mongoose.connection.db.collection(colName).deleteMany({});
        await mongoose.connection.db.collection(colName).insertMany(data);
      }
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('JSON DB Restore failed:', error.message);
    return false;
  }
}

function backupImages() {
  if (fs.existsSync(UPLOADS_DIR)) {
    console.log('Backing up images...');
    const imagesBackupPath = path.join(currentBackupPath, 'uploads.tar');
    execSync(`tar -cf "${imagesBackupPath}" -C "${UPLOADS_DIR}" .`, { stdio: 'inherit' });
  }
}

function restoreImages(backupName) {
  const imagesArchive = path.join(BACKUP_DIR, backupName, 'uploads.tar');
  if (fs.existsSync(imagesArchive)) {
    console.log('Restoring images...');
    ensureDir(UPLOADS_DIR);
    execSync(`tar -xf "${imagesArchive}" -C "${UPLOADS_DIR}"`, { stdio: 'inherit' });
  }
}

async function run() {
  const command = process.argv[2];
  const backupName = process.argv[3];
  const noImages = process.argv.includes('--no-images');

  if (command === 'backup') {
    const success = await backupJson();
    if (success && !noImages) backupImages();
    if (success) {
      console.log('Backup completed successfully.');
      console.log(`Location: ${currentBackupPath}`);
    }
  } else if (command === 'restore') {
    if (!backupName) {
      console.error('Error: Provide backup folder name.');
      process.exit(1);
    }
    const success = await restoreJson(backupName);
    if (success && !noImages) restoreImages(backupName);
    if (success) console.log('Restore completed successfully.');
  } else {
    console.log('Usage: node dbOps.js <backup|restore> [name] [--no-images]');
  }
  process.exit(0);
}

run();
