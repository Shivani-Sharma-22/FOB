import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import User from './models/userModel.js';

dotenv.config();

const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      console.log('No admin user found. Creating default admin...');

      await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@footonbridge.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        phone: '0000000000',
        role: 'admin',
        isVerified: true,
      });

      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Admin initialization error:', error.message);
  }
};

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const cors = require("cors");

app.use(cors({
  origin: ["http://localhost:5173", "https://fob-manage.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(uploadsDir));

app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/rewards', rewardRoutes);

app.get('/', (req, res) => {
  res.send('FOB Management System API is running...');
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    initializeAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});