const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: String,
    level: String,
    category: String,
    language: String,
    tutorial: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tutorial', tutorialSchema);
