const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// SKU Schema
const skuSchema = new mongoose.Schema({
  sku: { type: String, unique: true, required: true },
  timestamp: { type: Date, default: Date.now },
  createdBy: String,
});

const User = mongoose.model('User', userSchema);
const SKU = mongoose.model('SKU', skuSchema);

// Auth Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Registered' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all SKUs
app.get('/api/skus', verifyToken, async (req, res) => {
  const skus = await SKU.find().sort({ timestamp: -1 });
  res.json(skus);
});

// Add SKU
app.post('/api/skus', verifyToken, async (req, res) => {
  try {
    const { sku } = req.body;
    const exists = await SKU.findOne({ sku: sku.toUpperCase() });
    if (exists) return res.status(400).json({ error: 'SKU exists' });
    
    const newSKU = new SKU({ sku: sku.toUpperCase(), createdBy: req.userId });
    await newSKU.save();
    res.json({ sku: newSKU });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete SKU
app.delete('/api/skus/:id', verifyToken, async (req, res) => {
  await SKU.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// Import SKUs
app.post('/api/skus/import', verifyToken, async (req, res) => {
  const { skus } = req.body;
  let imported = 0, duplicates = 0;
  
  for (const sku of skus) {
    const exists = await SKU.findOne({ sku: sku.toUpperCase() });
    if (exists) duplicates++;
    else {
      await SKU.create({ sku: sku.toUpperCase(), createdBy: req.userId });
      imported++;
    }
  }
  
  res.json({ imported, duplicates });
});

// Stats
app.get('/api/stats', verifyToken, async (req, res) => {
  const total = await SKU.countDocuments();
  const allSKUs = await SKU.find();
  const counts = {};
  allSKUs.forEach(doc => {
    const lower = doc.sku.toLowerCase();
    counts[lower] = (counts[lower] || 0) + 1;
  });
  const duplicates = Object.values(counts).filter(c => c > 1).length;
  res.json({ total, duplicates, unique: total - duplicates });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));