const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/exerciseDB', { useNewUrlParser: true, useUnifiedTopology: true });

const ExerciseSchema = new mongoose.Schema({
  muscle: String,
  exercises: [
    {
      name: String,
      sets: Number,
      reps: Number
    }
  ]
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully!');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});


// Initialize DB
async function initializeDB() {
  const count = await Exercise.countDocuments();
  if (count === 0) {
    const data = JSON.parse(fs.readFileSync('exercise_data.json'));
    await Exercise.insertMany(data);
    console.log("Database initialized with exercise data.");
  }
}
initializeDB();

// API Key Middleware (from headers)
const validateApiKey = (req, res, next) => {
  const userKey = req.headers['x-api-key'];
  const serverKey = process.env.API_KEY;
  if (userKey === serverKey) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Unauthorized. Invalid API Key.' });
  }
};

// Get exercises by muscle group
app.get('/api/exercise/:muscle', validateApiKey, async (req, res) => {
  const muscleGroup = req.params.muscle;
  const record = await Exercise.findOne({ muscle: new RegExp(`^${muscleGroup}$`, 'i') });
  if (record) {
    res.json({ success: true, muscle: record.muscle, exercises: record.exercises });
  } else {
    res.status(404).json({ success: false, message: 'Muscle group not found.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
