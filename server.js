const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Use the port provided by the cloud service, or 3000 for local testing
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Get the Database URI from a secure environment variable
const MONGO_URI = process.env.MONGO_URI;

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch(err => console.error("MongoDB connection error:", err));

// Database Schema
const busSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  lastUpdated: { type: Date, default: Date.now }
});
const Bus = mongoose.model('Bus', busSchema);

// --- API Routes ---
app.post('/api/bus/update-location', async (req, res) => {
  const { busId, latitude, longitude } = req.body;
  if (!busId || !latitude || !longitude) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    await Bus.findOneAndUpdate(
      { busId: busId },
      {
        location: { type: 'Point', coordinates: [longitude, latitude] },
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Location updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/api/bus/location/:busId', async (req, res) => {
  try {
    const bus = await Bus.findOne({ busId: req.params.busId });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' });
    }
    res.status(200).json(bus);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});