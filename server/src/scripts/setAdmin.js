require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');

async function run() {
  await connectDB();

  // 1. Ensure admin@stocksense.in exists with Admin@123456
  let admin = await User.findOne({ email: 'admin@stocksense.in' });
  if (!admin) {
    admin = new User({
      name: 'StockSense Admin',
      email: 'admin@stocksense.in',
      password: 'Admin@123456',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    await admin.save();
    console.log('Created fresh admin user: admin@stocksense.in');
  } else {
    admin.role = 'admin';
    admin.isActive = true;
    admin.isEmailVerified = true;
    admin.password = 'Admin@123456';
    await admin.save();
    console.log('Reset admin user password to Admin@123456');
  }

  // 2. Also promote tushar accounts to admin role
  await User.updateMany(
    { email: { $in: ['tushar@gmail.com', 'tushar@gmail.com.in'] } },
    { $set: { role: 'admin', isEmailVerified: true, isActive: true } }
  );

  const admins = await User.find({ role: 'admin' }, 'email role isActive');
  console.log('Current Admin Accounts:', admins);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to set admin:', err);
  process.exit(1);
});
