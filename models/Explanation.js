const mongoose = require('mongoose');

const explanationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: String,
    explanation: String,
    language: String,
    complexity: String,
    summary: String,
    timeComplexity: String,
    spaceComplexity: String,
    logicBreakdown: [String],
    edgeCases: [String],
    bugs: [String],
    beginnerExplanation: String,
    recommendation: String,
    optimizedVersion: String,
    keyConcepts: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Explanation', explanationSchema);
