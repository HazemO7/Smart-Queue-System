const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const adminData = {
  name: process.env.ADMIN_NAME || 'System Admin',
  phone: process.env.ADMIN_PHONE || '01000000000',
  password: process.env.ADMIN_PASSWORD || 'Admin1234',
};

async function seedAdmin() {
  if (!process.env.DB_URL) {
    throw new Error('DB_URL is required in backend/.env');
  }

  await mongoose.connect(process.env.DB_URL);

  const hashedPassword = await bcrypt.hash(adminData.password, 10);
  const admin = await User.findOneAndUpdate(
    { phone: adminData.phone },
    {
      name: adminData.name,
      phone: adminData.phone,
      password: hashedPassword,
      role: 'admin',
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log(`Admin ready: ${admin.phone} (${admin._id})`);
}

seedAdmin()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Failed to seed admin: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  });
