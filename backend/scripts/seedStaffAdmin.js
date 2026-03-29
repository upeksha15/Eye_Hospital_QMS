/**
 * Creates a default admin staff account if none exists.
 * Usage: node scripts/seedStaffAdmin.js
 * Env: ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD (optional defaults below)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import StaffAccount from '../src/models/StaffAccount.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@eyehospital.local';
const PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'ChangeMe123!';
const NAME = process.env.ADMIN_SEED_NAME || 'System Administrator';

async function run() {
  await connectDB();
  const existing = await StaffAccount.findOne({ email: EMAIL.toLowerCase() });
  if (existing) {
    console.log('Staff admin already exists:', EMAIL);
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await StaffAccount.create({
    fullName: NAME,
    email: EMAIL.toLowerCase(),
    passwordHash,
    role: 'admin',
  });
  console.log('Created admin staff account:');
  console.log('  Email:', EMAIL);
  console.log('  Password:', PASSWORD);
  console.log('Change the password after first login.');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
