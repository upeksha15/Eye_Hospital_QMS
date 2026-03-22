import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Doctor from '../src/models/Doctor.js';
import Announcement from '../src/models/Announcement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const samples = [
  {
    fullName: 'Dr. Anil Perera',
    speciality: 'General Ophthalmology',
    room: 'OPD-A1',
    initials: 'AP',
    status: 'available',
  },
  {
    fullName: 'Dr. Sanduni Fernando',
    speciality: 'Retina & Vitreous',
    room: 'OPD-B2',
    initials: 'SF',
    status: 'limited',
  },
  {
    fullName: 'Dr. Roshan Silva',
    speciality: 'Glaucoma',
    room: 'OPD-C3',
    initials: 'RS',
    status: 'available',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await Doctor.countDocuments();
  if (count === 0) {
    await Doctor.insertMany(samples);
    console.log('Seeded doctors.');
  } else {
    console.log('Doctors already exist, skip seed.');
  }

  const ann = await Announcement.countDocuments({ isActive: true });
  if (ann === 0) {
    await Announcement.create({
      message:
        'Please arrive from 7:00 AM. Tokens are issued at digital check-in on a first-come basis.',
      isActive: true,
    });
    console.log('Seeded announcement.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
